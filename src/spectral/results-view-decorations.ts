import { TextEditor, TextEditorDecorationType, OverviewRulerLane } from 'vscode'
import { Findings, ScanFinding } from '../common/types'
import { formatWindowsPath, isWindows } from '../common/utils'
import { FindingSeverity, FindingType } from '../common/constants'
import { createTextDecoration, getFindingRange } from '../common/vs-code'
import concat from 'lodash/concat'
import compact from 'lodash/compact'
import isEmpty from 'lodash/isEmpty'

export const updateFindingsDecorations = (
  editor: TextEditor | undefined,
  findings: Findings
) => {
  if (!editor) {
    return
  }

  const docFilePath = isWindows()
    ? formatWindowsPath(editor.document.fileName.toLowerCase())
    : editor.document.fileName.toLowerCase()

  const fileFindings: any = concat(
    findings[FindingType.secret][docFilePath],
    findings[FindingType.iac][docFilePath]
  )

  if (isEmpty(fileFindings)) {
    // clean all decorations from the current file, if any
    Object.keys(severityDecorationsColors).forEach(
      (severity: FindingSeverity) => {
        editor.setDecorations(createDecorationTypeBySeverity(severity), [])
      }
    )
    return
  }

  Object.keys(severityDecorationsColors).forEach(
    (severity: FindingSeverity) => {
      decorateBySeverity({
        editor,
        severity,
        fileFindings: compact(fileFindings),
      })
    }
  )
}

const decorateBySeverity = ({
  editor,
  severity,
  fileFindings,
}: {
  editor: TextEditor
  severity: FindingSeverity
  fileFindings: Array<ScanFinding>
}): void => {
  const findingsBySeverity: any = fileFindings.filter(
    (finding) => finding.rule.severity === severity
  )

  if (isEmpty(findingsBySeverity)) {
    return
  }

  const rangesToDecorate = findingsBySeverity
    .map((finding: ScanFinding) => {
      const findingPosition = getFindingRange(finding)
      return findingPosition
        ? {
            range: findingPosition,
          }
        : false
    })
    .filter(Boolean)
  editor.setDecorations(
    createDecorationTypeBySeverity(severity),
    rangesToDecorate
  )
}

const severityDecorationsColors = {
  error: '#ce2c2e',
  warning: '#dfb22a',
  info: '#0d83f2',
}

const createDecorationTypeBySeverity = (
  severity: FindingSeverity
): TextEditorDecorationType =>
  createTextDecoration({
    cursor: 'pointer',
    borderWidth: '0px 0px 1px 0px',
    borderStyle: 'solid',
    overviewRulerColor: severityDecorationsColors[severity],
    overviewRulerLane: OverviewRulerLane.Right,
    light: {
      borderColor: severityDecorationsColors[severity],
    },
    dark: {
      borderColor: severityDecorationsColors[severity],
    },
  })

import {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticCollection,
  languages,
  DecorationRenderOptions,
  TextEditorDecorationType,
  window,
  TreeDataProvider,
  TreeView,
  StatusBarItem,
  StatusBarAlignment,
  Uri,
  workspace,
  Range,
  commands,
} from 'vscode'
import {
  CONTEXT_PREFIX,
  FindingSeverity,
  FINDING_POSITION_COL_INDEX,
  FINDING_POSITION_LINE_INDEX,
  PLAYBOOKS_URL,
} from './constants'
import { Findings, ScanFinding, ScanFindingView } from './types'

export const setContext = async (key: string, value: any): Promise<void> => {
  await commands.executeCommand('setContext', `${CONTEXT_PREFIX}${key}`, value)
}

export const getActiveTextEditor = () => window.activeTextEditor

export const createTextDecoration = (
  options: DecorationRenderOptions
): TextEditorDecorationType => window.createTextEditorDecorationType(options)

export const ShowNotificationMessage = ({
  messageType,
  messageText,
  items = [],
}: {
  messageType: 'error' | 'warning' | 'info'
  messageText: string
  items?: Array<string>
}): Thenable<string> => {
  switch (messageType) {
    case 'error':
      return window.showErrorMessage(messageText, ...items)
    case 'warning':
      return window.showWarningMessage(messageText, ...items)
    case 'info':
      return window.showInformationMessage(messageText, ...items)
    default:
      return window.showInformationMessage(messageText, ...items)
  }
}

type TreeOptions<T> = {
  treeDataProvider: TreeDataProvider<T>
}

export const createTree = <T>({
  viewId,
  options,
}: {
  viewId: string
  options: TreeOptions<T>
}): TreeView<T> => {
  return window.createTreeView(viewId, options)
}

type StatusBarSettings = {
  location: 'right' | 'left'
  //The larger the number the more left the item will be
  priority: number
  text: string
  tooltip: string
}

export const createStatusBarItem = (
  settings: StatusBarSettings
): StatusBarItem => {
  const item = window.createStatusBarItem(
    settings.location == 'right'
      ? StatusBarAlignment.Right
      : StatusBarAlignment.Left,
    settings.priority
  )

  item.text = settings.text
  if (settings.tooltip) {
    item.tooltip = settings.tooltip
  }
  return item
}

export const runWithLoaderOnView = async ({
  viewId,
  action,
}: {
  viewId: string
  action: () => Promise<void>
}) => {
  await window.withProgress(
    {
      location: { viewId },
    },
    async () => {
      await action()
    }
  )
}

type InputBoxOptions = {
  password: boolean
  placeHolder: string
  title: string
}

export const showInputBox = (
  options: InputBoxOptions,
  task: (value) => Promise<void>
) => {
  window
    .showInputBox({
      password: options.password,
      placeHolder: options.placeHolder,
      title: options.title,
    })
    .then(async (value) => {
      if (value) {
        await task(value)
      }
    })
}

const severityToDiagnosticSeverity = {
  [FindingSeverity.critical]: DiagnosticSeverity.Error,
  [FindingSeverity.high]: DiagnosticSeverity.Error,
  [FindingSeverity.medium]: DiagnosticSeverity.Warning,
  [FindingSeverity.low]: DiagnosticSeverity.Warning,
  [FindingSeverity.informational]: DiagnosticSeverity.Information,
}

export const appendFindingsToProblemsChannel = (
  findings: Findings
): DiagnosticCollection => {
  const collection = languages.createDiagnosticCollection('Spectral')

  const diagnosticItemsPerFile = Object.values(findings).reduce(
    (acc: Record<string, Diagnostic[]>, findingTypeItems) => {
      Object.entries(findingTypeItems).forEach(
        ([filePath, items]: [string, ScanFindingView[]]) => {
          const diagnosticItems = items.map((item: ScanFindingView) => {
            const diagnostic = createDiagnosticItem(item)
            diagnostic.code = {
              value: `Spectral ${item.rule.id}`,
              target: Uri.parse(`${PLAYBOOKS_URL}/${item.rule.id}`),
            }
            return diagnostic
          })

          if (acc[filePath]) {
            acc[filePath] = [...acc[filePath], ...diagnosticItems]
          } else {
            acc[filePath] = diagnosticItems
          }
        }
      )
      return acc
    },
    {}
  )

  const diagnosticCollection: Array<[Uri, Array<Diagnostic>]> = Object.entries(
    diagnosticItemsPerFile
  ).map(([filePath, diagnosticItems]) => [Uri.file(filePath), diagnosticItems])

  collection.set(diagnosticCollection)
  return collection
}

const createDiagnosticItem = (finding: ScanFindingView): Diagnostic => {
  return new Diagnostic(
    getFindingRange(finding),
    `${finding.rule.name} - ${finding.rule.description}`,
    severityToDiagnosticSeverity[finding.rule.severity]
  )
}

export const getWorkspaceFolders = (): Array<string> =>
  workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) || []

export const getFindingRange = (finding: ScanFinding): Range => {
  const startRow = finding.position?.start[FINDING_POSITION_LINE_INDEX] || 0
  const startCol = finding.position?.start[FINDING_POSITION_COL_INDEX] || 0
  const endRow = finding.position?.end[FINDING_POSITION_LINE_INDEX] || 0
  const endCol = finding.position?.end[FINDING_POSITION_COL_INDEX] || 0
  const startLine = startRow > 0 ? startRow - 1 : 1
  const startChar = startCol <= 1 ? startCol : startCol - 1
  const endLine = endRow > 0 ? endRow - 1 : 1
  const endChar = endCol <= 1 ? endCol + 3 : endCol - 1
  return finding.position
    ? new Range(startLine, startChar, endLine, endChar)
    : null
}

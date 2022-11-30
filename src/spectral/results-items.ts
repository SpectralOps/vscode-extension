import {
  TreeItem,
  TreeDataProvider,
  ProviderResult,
  TreeItemCollapsibleState,
  Uri,
  ThemeIcon,
} from 'vscode'
import L from 'lodash'
import { basename, dirname, join } from 'path'
import isEmpty from 'lodash/isEmpty'
import { getFindingRange } from '../common/vs-code'
import {
  FindingsTypeResults,
  ScanFinding,
  ScanFindingView,
} from '../common/types'
import { FindingSeverity, FindingSeverityLevel } from '../common/constants'

export class FindingsProvider implements TreeDataProvider<TreeItem> {
  private readonly findings: FindingsTypeResults
  constructor(findings: FindingsTypeResults) {
    this.findings = findings
  }
  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element
  }
  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    if (!element) {
      if (!isEmpty(this.findings)) {
        return Promise.resolve(new WorkspaceItem(this.findings).fileNodes)
      } else {
        return Promise.resolve([
          new EmptyItem('Great job! no issues were found.'),
        ])
      }
    } else {
      return Promise.resolve((<FileItem>element).findingNodes)
    }
  }
}

export class WorkspaceItem extends TreeItem {
  fileNodes: Array<FileItem>
  constructor(findings: FindingsTypeResults) {
    super('', TreeItemCollapsibleState.Collapsed)
    this.fileNodes = this.getFilesNodes(findings)
  }

  private getFilesNodes(findings: FindingsTypeResults) {
    const orderedFindings = L(findings)
      .toPairs()
      .orderBy([0], ['asc'])
      .fromPairs()
      .value()
    return Object.entries(orderedFindings).map(
      ([filePath, fileFindings]: [string, Array<ScanFindingView>]) => {
        const rootPath = fileFindings[0].rootPath
        const path = filePath.startsWith(rootPath)
          ? filePath.substring(rootPath.length)
          : filePath
        return new FileItem(path, fileFindings)
      }
    )
  }
}

export class FindingItem extends TreeItem {
  private iconsPath = {
    [FindingSeverity.critical]: join(
      __filename,
      '..',
      '..',
      'media',
      'critical.svg'
    ),
    [FindingSeverity.high]: join(__filename, '..', '..', 'media', 'high.svg'),
    [FindingSeverity.medium]: join(
      __filename,
      '..',
      '..',
      'media',
      'medium.svg'
    ),
    [FindingSeverity.low]: join(__filename, '..', '..', 'media', 'low.svg'),
    [FindingSeverity.informational]: join(
      __filename,
      '..',
      '..',
      'media',
      'informational.svg'
    ),
  }
  constructor(finding: ScanFinding) {
    super(finding.rule.name, TreeItemCollapsibleState.None)
    const findingPosition = getFindingRange(finding)
    this.tooltip = L.capitalize(finding.rule.severity)
    this.iconPath = {
      light: this.iconsPath[finding.rule.severity],
      dark: this.iconsPath[finding.rule.severity],
    }
    this.command = {
      title: 'Open',
      command: 'vscode.open',
      arguments: [Uri.parse(finding.finding), { selection: findingPosition }],
    }
  }
}

export class FileItem extends TreeItem {
  findingNodes: Array<FindingItem>

  constructor(filePath: string, findings: Array<ScanFinding>) {
    super(basename(filePath), TreeItemCollapsibleState.Collapsed)
    this.resourceUri = Uri.file(filePath)
    this.iconPath = ThemeIcon.File
    this.description = dirname(filePath).substring(1)
    this.findingNodes = findings
      .sort((a, b) => {
        if (
          FindingSeverityLevel[a.rule.severity] <
          FindingSeverityLevel[b.rule.severity]
        ) {
          return -1
        }
        if (
          FindingSeverityLevel[a.rule.severity] >
          FindingSeverityLevel[b.rule.severity]
        ) {
          return 1
        }
        return 0
      })
      .map((finding) => new FindingItem(finding))
  }
}

export class EmptyItem extends TreeItem {
  constructor(message: string) {
    super(message, TreeItemCollapsibleState.None)
  }
}

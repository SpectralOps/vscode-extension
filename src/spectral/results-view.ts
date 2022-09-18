import { DiagnosticCollection, TreeItem } from 'vscode'
import gt from 'lodash/gt'
import {
  appendFindingsToProblemsChannel,
  createTree,
  ShowNotificationMessage,
} from '../common/vs-code'
import {
  Findings,
  FindingsAggregations,
  FindingsTypeResults,
} from '../common/types'
import { SPECTRAL_VIEW_IAC, SPECTRAL_VIEW_SECRETS } from '../common/constants'
import { FindingsProvider } from './results-items'

export class ResultsView {
  private problemsCollection: DiagnosticCollection

  public refresh({
    findings,
    findingsAggregations,
  }: {
    findings: Findings
    findingsAggregations: FindingsAggregations
  }) {
    this.createResultsViews({
      results: findings.secret,
      viewId: SPECTRAL_VIEW_SECRETS,
      viewTitle: `Secrets (${findingsAggregations.secret})`,
    })

    this.createResultsViews({
      results: findings.iac,
      viewId: SPECTRAL_VIEW_IAC,
      viewTitle: `IaC (${findingsAggregations.iac})`,
    })

    if (this.problemsCollection) {
      this.problemsCollection.clear()
    }
    this.problemsCollection = appendFindingsToProblemsChannel(findings)

    this.showResultNotification(findingsAggregations)
  }

  private createResultsViews({
    results,
    viewId,
    viewTitle,
  }: {
    results: FindingsTypeResults
    viewId: string
    viewTitle: string
  }): void {
    const secretsTree = createTree<TreeItem>({
      viewId: viewId,
      options: {
        treeDataProvider: new FindingsProvider(results),
      },
    })

    secretsTree.title = viewTitle
  }

  private showResultNotification(
    findingsAggregations: FindingsAggregations
  ): void {
    if (gt(findingsAggregations.iac, 0) || gt(findingsAggregations.secret, 0)) {
      const totalFindings =
        findingsAggregations.iac + findingsAggregations.secret

      ShowNotificationMessage({
        messageType: 'info',
        messageText: `Scan finished. Found ${totalFindings} issue${
          totalFindings > 1 ? 's' : ''
        }`,
      })
    } else {
      ShowNotificationMessage({
        messageType: 'info',
        messageText: 'Great job! No issue were found',
      })
    }
  }
}

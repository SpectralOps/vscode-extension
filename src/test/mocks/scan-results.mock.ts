import { concat } from 'lodash'
import { FindingSeverity } from '../../common/constants'
import { ScanResult } from '../../common/types'

export const scanSecretsSingleFinding: ScanResult = {
  items: [
    {
      finding: '/Users/testUser/git/vscode-extension/src/common/state.ts',
      position: {
        start: [1, 5],
        end: [1, 2],
      },
      rule: {
        id: 'CLD001',
        name: 'Visible AWS Key',
        severity: FindingSeverity.error,
        description: 'Found a visible AWS Key',
      },
      metadata: {
        tags: ['base', 'amazon'],
      },
    },
  ],
}

export const scanIacSingleFinding: ScanResult = {
  items: [
    {
      finding: '/Users/testUser/git/vscode-extension/src/common/state.ts',
      position: {
        start: [1, 5],
        end: [1, 2],
      },
      rule: {
        id: 'AZURE001',
        name: 'Missing email account admins for security alerts',
        severity: FindingSeverity.warning,
        description: 'Missing email account admins for security alerts',
      },
      metadata: {
        tags: ['azure', 'iac'],
      },
    },
  ],
}

export const scanSingleFindingEachType: ScanResult = {
  items: concat(scanSecretsSingleFinding.items, scanIacSingleFinding.items),
}

export const scanMultipleSecrets: ScanResult = {
  items: [
    {
      finding: '/Users/testUser/git/vscode-extension/src/common/state.ts',
      position: {
        start: [1, 5],
        end: [1, 2],
      },
      rule: {
        id: 'CLD001',
        name: 'Visible AWS Key',
        severity: FindingSeverity.error,
        description: 'Found a visible AWS Key',
      },
      metadata: {
        tags: ['base', 'amazon'],
      },
    },
    {
      finding:
        '/Users/testUser/git/vscode-extension/src/services/context-service.ts',
      position: {
        start: [1, 5],
        end: [1, 2],
      },
      rule: {
        id: 'CLD001',
        name: 'Visible AWS Key',
        severity: FindingSeverity.error,
        description: 'Found a visible AWS Key',
      },
      metadata: {
        tags: ['base', 'amazon'],
      },
    },
  ],
}

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

export const scanOssSingleFinding: ScanResult = {
  items: [
    {
      finding: '/Users/testUser/git/vscode-extension/package-lock.json',
      position: {
        start: [1, 1],
        end: [1, 1],
      },
      rule: {
        id: 'CVE-2018-20834',
        name: 'CVE-2018-20834',
        severity: FindingSeverity.high,
        description:
          'A vulnerability was found in node-tar before version 4.4.2 (excluding version 2.2.2). An Arbitrary File Overwrite issue exists when extracting a tarball containing a hardlink to a file that already exists on the system, in conjunction with a later plain file with the same name as the hardlink. This plain file content replaces the existing file content. A patch has been applied to node-tar v2.2.2).',
      },
      metadata: {
        tags: ['oss'],
      },
    },
  ],
}

export const scanSingleFindingEachType: ScanResult = {
  items: concat(
    scanSecretsSingleFinding.items,
    scanIacSingleFinding.items,
    scanOssSingleFinding.items
  ),
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

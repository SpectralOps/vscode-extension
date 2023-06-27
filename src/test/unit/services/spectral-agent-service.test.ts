import assert from 'assert'
import { SpectralAgentService } from '../../../services/spectral-agent-service'
import {
  scanIacSingleFinding,
  scanMultipleSecrets,
  scanOssSingleFinding,
  scanSecretsSingleFinding,
  scanSingleFindingEachType,
} from '../../mocks/scan-results.mock'

suite('Spectral agent service', () => {
  test('[ok] - process only secrets - aggregations should be as items length', () => {
    const spectralAgentService = new SpectralAgentService()
    spectralAgentService.processResults(scanSecretsSingleFinding, 'somePath')
    assert.strictEqual(
      spectralAgentService.findingsAggregations.secret,
      scanSecretsSingleFinding.items.length
    )
  })

  test('[ok] - process only iac - aggregations should be as items length', () => {
    const spectralAgentService = new SpectralAgentService()
    spectralAgentService.processResults(scanOssSingleFinding, 'somePath')
    assert.strictEqual(
      spectralAgentService.findingsAggregations.oss,
      scanOssSingleFinding.items.length
    )
  })

  test('[ok] - process only oss - aggregations should be as items length', () => {
    const spectralAgentService = new SpectralAgentService()
    spectralAgentService.processResults(scanIacSingleFinding, 'somePath')
    assert.strictEqual(
      spectralAgentService.findingsAggregations.iac,
      scanIacSingleFinding.items.length
    )
  })

  test('[ok] - process both finding types - aggregations should be as items length', () => {
    const spectralAgentService = new SpectralAgentService()
    spectralAgentService.processResults(scanSingleFindingEachType, 'somePath')
    const expectedIacItems = 1
    const expectedSecretsItems = 1
    assert.strictEqual(
      spectralAgentService.findingsAggregations.iac,
      expectedIacItems,
      'iac validation failed'
    )
    assert.strictEqual(
      spectralAgentService.findingsAggregations.secret,
      expectedSecretsItems,
      'secrets validation failed'
    )
  })

  test('[ok] - process finding - findings should be aggregated by the finding path', () => {
    const spectralAgentService = new SpectralAgentService()
    spectralAgentService.processResults(scanSecretsSingleFinding, 'somePath')
    const findingKey = Object.keys(spectralAgentService.findings.secret)[0]
    assert.strictEqual(findingKey, scanSecretsSingleFinding.items[0].finding)
  })

  test('[ok] - process finding - different findings should be aggregated by different finding path', () => {
    const spectralAgentService = new SpectralAgentService()
    spectralAgentService.processResults(scanMultipleSecrets, 'somePath')
    const expectedKeys = scanSingleFindingEachType.items.length
    const actualKeys = Object.keys(spectralAgentService.findings.secret).length
    assert.strictEqual(actualKeys, expectedKeys)
  })
})

import path from 'path';

export class SpectralConfig {
  private static readonly configFileName = 'spectral.config.json';

  readonly mixPanelKey: string;

  static get(extensionPath: string): Promise<SpectralConfig> {
    return import(path.join(extensionPath, this.configFileName)) as Promise<SpectralConfig>;
  }
}

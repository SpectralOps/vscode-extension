export const formatWindowsPath = (path: string): string => {
  const stringToReplace = new RegExp(/\\/, 'g')
  return `/${path.replace(stringToReplace, '/')}`
}

export const isWindows = (): boolean => process.platform === 'win32'

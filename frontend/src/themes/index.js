import deepBlue from './deepBlue'
import forestInk from './forestInk'
import sunsetPaper from './sunsetPaper'

export const themes = [deepBlue, forestInk, sunsetPaper]

export const defaultTheme = deepBlue

export const themeMap = themes.reduce((result, theme) => {
  result[theme.id] = theme
  return result
}, {})

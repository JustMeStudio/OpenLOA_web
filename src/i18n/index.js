import { createI18n } from 'vue-i18n'
import zhCN from './lang/zh-CN'
import enUS from './lang/en-US'

const supportedLocales = ['zh-CN', 'en-US']

const getBrowserLocale = () => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && supportedLocales.includes(savedLocale)) {
    return savedLocale
  }
  
  const browserLang = navigator.language || navigator.userLanguage
  
  if (browserLang) {
    const lang = browserLang.toLowerCase()
    
    if (lang.startsWith('zh')) {
      return 'zh-CN'
    }
    
    if (lang.startsWith('en')) {
      return 'en-US'
    }
    
    const exactMatch = supportedLocales.find(locale => 
      locale.toLowerCase() === lang
    )
    if (exactMatch) {
      return exactMatch
    }
    
    const prefixMatch = supportedLocales.find(locale => 
      lang.startsWith(locale.split('-')[0].toLowerCase())
    )
    if (prefixMatch) {
      return prefixMatch
    }
  }
  
  return 'en-US'
}

const i18n = createI18n({
  legacy: false,
  locale: getBrowserLocale(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n

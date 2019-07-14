import * as puppeteer from 'puppeteer'
import * as signale from 'signale'

import KitaBisa from './kitabisa'

class Apps extends KitaBisa {
  public account: KitaBisa.Account

  public browser: puppeteer.Browser
  public page: puppeteer.Page

  constructor() {
    super()
  }

  async initialize(account: KitaBisa.Account) {
    signale.info('[Apps][1/4] start browser')
    
    this.browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    this.page = await this.browser.newPage();

    await this.requestHandler(true)

    await this.page.setRequestInterception(true)
    await this.page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1')
    signale.info('[Apps][2/4] engine is ready!')

    await this.setCredential(account)
    await this.authenticate()
  }

  async authenticate() {
    signale.info('[Apps][3/4] load latest login cookies')
    await this.loadCookie();
    
    const isLogined: boolean = await this.isLogined();
    
    if (!isLogined) {
      signale.info('[Apps] navigate browser to kitabisa.com login page')
      await this.signIn();
    }

    signale.info('[Apps][3/4] authentication done!')
    signale.info('[Apps][4/4] initialize done!')    
  }

  private async requestHandler(block: boolean) {
    const callbackRequest = (request: puppeteer.Request) => {
      const headers = request.headers()
      if (headers.referer) {
        if (headers.referer.indexOf('pay-with-wallet/done') != -1) return request.continue();
      }
      
      // block only resouceType images and not from kitabisa.com assets (web required)
      if (request.resourceType() === 'image' && !request.url().includes('assets.kitabisa.com/images/')) {
        request.abort();
      } else if (request.resourceType() === 'stylesheet') {
        request.abort();
      } else {
        request.continue();
      }
    }
    
    if (block)
      this.page.on('request', callbackRequest);
    else 
      this.page.off('request', callbackRequest);
  }
}

module.exports = Apps
import { mtv2Page } from './app.po';

describe('mtv2 App', () => {
  let page: mtv2Page;

  beforeEach(() => {
    page = new mtv2Page();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});

const { test, expect, beforeEach, describe } = require('@playwright/test')


describe('Blog app', () => {

  beforeEach(async ({ request, page }) => {
    await request.post('http:localhost:3003/api/testing/reset')
    const response = await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    })
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByTestId('login-form')).toBeVisible()
    await expect(page.getByTestId('username')).toBeVisible()
    await expect(page.getByTestId('password')).toBeVisible()
    await expect(page.getByTestId('login-button')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await page.getByTestId('username').fill('mluukkai')
      await page.getByTestId('password').fill('salainen')
      await page.getByTestId('login-button').click()
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })


    test('fails with wrong credentials', async ({ page }) => {
      await page.getByTestId('username').fill('mluukkai')
      await page.getByTestId('password').fill('wrongpassword')
      await page.getByTestId('login-button').click()
      await expect(page.getByText('wrong username or password')).toBeVisible()
    })
  })

  describe('When logged in', () => {

    beforeEach(async({ page }) => {
      await page.getByTestId('username').fill('mluukkai')
      await page.getByTestId('password').fill('salainen')
      await page.getByTestId('login-button').click()
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()

      // Log the contents of local storage after login
      // const localStorageContent = await page.evaluate(() => localStorage)
      // console.log(localStorageContent)
      // console.log(JSON.parse(localStorageContent.loggedAppUser))
      // console.log(JSON.parse(localStorageContent.loggedAppUser).token)
      page.reload()
    })

    test('a new blog can be created', async ({ page }) => {
      await page.getByRole('button', {name: 'create new blog'}).click()
      await page.getByTestId('new-blog-title').fill('My newest blog about roadbikes')
      await page.getByTestId('new-blog-author').fill('Shimano Taki')
      await page.getByTestId('new-blog-url').fill('shimano.bikes.com')
      await page.getByRole('button', {name: 'Create'}).click()
      await expect(page.getByText('A new blog My newest blog about roadbikes by Shimano Taki was added')).toBeVisible()
      const latestBlogPost = page.locator('.blogpost').first()
      await expect(latestBlogPost.locator('.blog-title')).toHaveText('My newest blog about roadbikes');
      await expect(latestBlogPost.locator('.blog-author')).toContainText('Shimano Taki');
    })

    describe('when a new blog exists', () => {
      beforeEach(async({ request, page }) => {
        await page.getByRole('button', {name: 'create new blog'}).click()
        await page.getByTestId('new-blog-title').fill('My newest blog about roadbikes')
        await page.getByTestId('new-blog-author').fill('Shimano Taki')
        await page.getByTestId('new-blog-url').fill('shimano.bikes.com')
        await page.getByRole('button', {name: 'Create'}).click()
      })

      test('Blog can be liked', async({ page }) => {
        await page.getByRole('button', {name: 'view'}).click()
        const beginningLikes = Number(await page.getByTestId('blog-likes'))
        await page.getByRole('button', {name: 'Like'}).click()
        const endLikes = Number(await page.getByTestId('blog-likes'))
        expect(endLikes === beginningLikes-1)
      })

      test('Blog can be deleted by creator', async({ page }) => {
        await page.getByRole('button', {name: 'view'}).click()
        page.on('dialog', dialog => dialog.accept());
        await page.getByRole('button', {name: 'Remove'}).click()
        // Wait for the blog post details to disappear
        await page.waitForSelector('.blogpost', { state: 'hidden' });

        // Assert that the blogpost element is not visible on the page
        const blogpostElements = await page.$$('.blogpost');
        expect(blogpostElements).toHaveLength(0);
      })
    })
  })
})
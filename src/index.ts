import * as PostalMime from 'postal-mime'


import {
  Env,
} from './types'


// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleEmail(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
  const parser = new PostalMime.default()

  // parse email content
  const rawEmail = new Response(message.raw)

  const email = await parser.parse(await rawEmail.arrayBuffer())

  const content = `
# **【你有新邮件，请及时处理】**
|主题|${message.headers.get('subject')}|
|:-:|:-:|
|发件人|${message.from}|
|收件人|${message.to}|
\`\`\`邮件内容
${email.text??"无内容"}
\`\`\`
`

  const body = {
    "msgtype": "markdown_v2",
    "markdown_v2": {
      "content": content
    }
  }

  if (!await sendToWebhook(body)) {
    message.forward("laoshancun@foxmail.com")
  }
}

async function sendToWebhook(body: any) {
  const req = new Request("https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=57720378-4f5b-4fca-a69d-7f340a960ff5", {
    method: "POST",
    body: JSON.stringify(body)
  })
  req.headers.append("Content-Type", "application/json")
  const res = await fetch(req);
  return res.ok
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      await handleEmail(message, env, ctx)
    } catch (error) {
      const body = {
        "msgtype": "text",
        "text": {
          "content": `转发邮件[${message.headers.get('subject')}]\n错误:${error}`
        }
      }
      await sendToWebhook(body)
    }

  }
}
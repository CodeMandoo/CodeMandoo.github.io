const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs')
const WebSocket = require('ws')

const { Configuration, OpenAIApi } = require("openai");
const { OPENAI_API_KEY } = require('./key.json');
const { log } = require('console');

const app = express()
const upload = multer();
app.use(cors())
app.use(express.json()); // 解析 JSON 数据
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码数据
// app.use(bodyParser.urlencoded({extended: true}))
// // 使用bodyParser中间件解析 application/json 格式的数据
// app.use(bodyParser.json());
console.log(OPENAI_API_KEY);
const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
    basePath: 'https://ngapi.fun/v1'
});

const whisperConfig = new Configuration({
    apiKey: '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',
    // apiKey: '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',
    basePath: 'https://service-665t7n6s-1304266622.hk.apigw.tencentcs.com/v1'
});

const openai = new OpenAIApi(configuration);

const whisper = new OpenAIApi(whisperConfig);

async function recoganizeAudio(audio) {
    fs.writeFileSync('./audio/audio.webm', audio, (err) => {
        console.log('读取音频错误',err);
      })
    const stream = fs.createReadStream('./audio/audio.webm')
    const translate = await whisper.createTranscription(stream, 'whisper-1', 'chinese')
    const command = '你是一个机器狗动作命令分析助手，你的任务是根据控制员的语音转录文本在发音和含义两个方向去进行推断成以下一个命令【跑，跳舞，左转弯，右转弯，前进，拜年，无】，只能回复给我命令，无法推断就回复“无"'
    const command1 = '你是一个人工智能机器狗，你的名字叫qilin, 你必须根据控制员的语音转录文本通过含义两方面去分析出控制员的要求并执行以下某一个命令【不要动，站立, 跑，跳跃，跳舞，左转弯，右转弯，前进，拜年，无】（如果没有喊你名字回复无），只回复命令给我'
    const command2 = '你是一个人工智能机器狗,你必须根据控制员的语音转义文本通过其含义和发音去推断出控制员的要求最终执行以下某一个动作指令【停止，站起来，跑，跳舞，左转弯，右转弯，前进，拜年，无】'
    console.log(translate.data.text);
    const chat_completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          "role": 'system', 
          content: command1
        },
        { 
          role: "assistant", 
          content: translate.data.text 
        }
      ],
    })
    return {
      translate: translate.data.text,
      recoganize: chat_completion.data.choices[0].message.content
    }
}

app.post('/send-text', async (req, res) => {
    const message = req.body.message
    try {
        const chat_completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{ role: "user", content: message }]
        });
        res.send(JSON.stringify(chat_completion.data.choices[0].message))
    } catch (error) {
        console.log('文字解析错误：',error);
    }
})


app.post('/recoganize',upload.single('audio'), async (req, res) => {
   
    // 获取音频数据
  const audioData = req.file.buffer;
  fs.writeFileSync('./audio/audio.webm', audioData, (err) => {
    console.log('写入音频错误',err);
  })
  const stream = fs.createReadStream('./audio/audio.webm')
  const translate = await whisper.createTranscription(stream, 'whisper-1', 'chinese')
  console.log('音频转文字：',translate.data.text);
          const command = `${translate.data.text}`
          try {
            const command = '你是一个机器狗动作命令分析助手，你的任务是根据控制员的语音转录文本在发音和含义两个方向去进行推断成以下一个命令【跑，跳舞，左转弯，右转弯，前进，拜年，无】，只能回复给我命令，无法推断就回复“无"'
            const command1 = '你是一个人工智能机器狗，你的名字叫qilin, 你必须根据控制员的语音转录文本通过含义两方面去分析出控制员的要求并执行以下某一个命令【不要动，站立, 跑，跳跃，跳舞，左转弯，右转弯，前进，拜年，无】（如果没有喊你名字只回复无），只回复命令给我'
            const command2 = '你是一个人工智能机器狗,你必须根据控制员的语音转义文本通过其含义和发音去推断出控制员的要求最终执行以下某一个动作指令【停止，站起来，跑，跳舞，左转弯，右转弯，前进，拜年，无】'
            const chat_completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{"role": 'system', 
            content: command1},{ role: "assistant", content: translate.data.text }],
        })
            console.log('识别指令：', chat_completion.data.choices[0].message);
              res.send(chat_completion.data.choices[0].message)
            
          } catch (error) {
            console.log('指令分析错误：', error);
          }
        })

const server = app.listen(3000, () => {
    console.log('listening...');
})

const recoganizeSocket = new WebSocket.Server({port:3002})

// 监听WebSocket连接
recoganizeSocket.on('connection', (ws) => {
    console.log('WebSocket connected');
  
    // 监听客户端发送的消息
    ws.on('message', (message) => {
      try {
        recoganizeAudio(message).then((res) => {
          console.log('send',res);
          ws.send(res.translate + '-' + res.recoganize)
          })
      } catch (error) {
        console.log(error);
      }
    });
  
    // 监听客户端断开连接
    ws.on('close', () => {
      console.log('WebSocket disconnected');
    });

    ws.on('error', (error) => {
        console.log(error);
    })
});

const chatSocket = new WebSocket.Server({port:3001})
chatSocket.on('connection', (ws) => {
  console.log('chatSocket connected');
  const command = '你是一个人工智能机器狗，你的名字叫qilin, 我提供一段控制员的语音识别文本，你通过含义和读音两方面去分析出控制员可能希望你执行的以下某一个命令【不要动，站立, 跑，跳跃，跳舞，左转弯，右转弯，前进，拜年，无】,控制员必须喊你名字你才执行命令，只回复命令给我'
  // 监听客户端发送的消息
  ws.on('message', async (content) => {
    console.log('收到语音:',content.toString());
    const chat_completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{
        "role": 'system', 
        content: command
      },
      { 
        role: "user", 
        content: content.toString()
      }]
    });
    ws.send(JSON.stringify(chat_completion.data.choices[0].message.content))
  });

  // 监听客户端断开连接
  ws.on('close', () => {
    console.log('chatsocket disconnected');
  });

  ws.on('error', (error) => {
      console.log(error);
  })
});
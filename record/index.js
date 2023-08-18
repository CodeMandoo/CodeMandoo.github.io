try {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
// const voice = new Wad({
//     source: 'mic'
// })
// const polywad = new Wad.Poly({
//     audioMeter: {
//         // clipLevel: .98, // the level (0 to 1) that you would consider "clipping".
//         // averaging: .95, // how "smoothed" you would like the meter to be over time. Should be between 0 and less than 1.
//         // clipLag: 750, // how long you would like the "clipping" indicator to show after clipping has occured, in milliseconds.
//     }
// })
// polywad.add(voice)
// let silenceCount = 0
// let speakCount = 0
// setInterval(function(){
//     if(!recorder) return
//     const volume = Math.round(polywad.audioMeter.volume * 1000)
//     if(volume > 20) {
//         silenceCount = 0
//         speakCount++
//         console.log('说话中...', '音量' + volume);
//         console.log(voice, voice.volume);
//     }else {
//         // console.log('静音中...');
//         silenceCount++
//         const state = recorder.state
//         if(silenceCount >=3 && state === 'recording' && speakCount > 5){
//             // 请求保存音频流 自动push到chunks中
//             recorder.requestData()
//             // setTimeout(() => {
//             //     const chunks = recorder.chunks
//             //     console.log('-----chunks:',recorder.chunks);
//             //     const recorderFile = new Blob(chunks, { 'type' : 'webm' });
//             //     console.log(recorderFile);
//             //     // sendAudioMessage(recorderFile)
//             //     // polywad.recorder.chunks = []
//             // })
//             // console.log('获取音频');
//         }
//         if(silenceCount >=3) {
//             speakCount = 0
//         }
//     }
// }, 100)

var MediaUtils = {
    /**
     * 获取用户媒体设备(处理兼容的问题)
     * @param videoEnable {boolean} - 是否启用摄像头
     * @param audioEnable {boolean} - 是否启用麦克风
     * @param callback {Function} - 处理回调
     */
    getUserMedia: function (videoEnable, audioEnable, callback) {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
            || navigator.msGetUserMedia || window.getUserMedia;
        var constraints = {video: videoEnable, audio: audioEnable};
        console.log(navigator, window);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                callback(false, stream);
            })['catch'](function(err) {
                callback(err);
            });
        } else if (navigator.getUserMedia) {
            navigator.getUserMedia(constraints, function (stream) {
                callback(false, stream);
            }, function (err) {
                callback(err);
            });
        } else {
            callback(new Error('Not support userMedia'));
        }
    },

    /**
     * 关闭媒体流
     * @param stream {MediaStream} - 需要关闭的流
     */
    closeStream: function (stream) {
        if (typeof stream.stop === 'function') {
            stream.stop();
        }
        else {
            let trackList = [stream.getAudioTracks(), stream.getVideoTracks()];

            for (let i = 0; i < trackList.length; i++) {
                let tracks = trackList[i];
                if (tracks && tracks.length > 0) {
                    for (let j = 0; j < tracks.length; j++) {
                        let track = tracks[j];
                        if (typeof track.stop === 'function') {
                            track.stop();
                        }
                    }
                }
            }
        }
    }
};

const socket = new WebSocket('ws://192.168.31.109:3000')
console.log(socket);
let connect = false

socket.onopen = () => {
    console.log('open');
    connect = true
}

socket.onmessage = (msg) => {
    console.log(msg.data);
    document.querySelector('#result').innerText = msg.data
}

function sendAudioMessage(audio) {
    if(!connect) return
    socket.send(audio)
}

function stopSendAudio() {
    connect = false
}

// 用于存放 MediaRecorder 对象和音频Track，关闭录制和关闭媒体设备需要用到
var recorder, mediaStream;

// 用于存放录制后的音频文件对象和录制结束回调
var recorderFile, stopRecordCallback;

// 用于存放是否开启了视频录制
var videoEnabled = false;

var needSave = false

// 录制短语音
function startRecord(enableVideo) {
    videoEnabled = enableVideo;
    // voice.play()
    // polywad.play()
    // polywad.recorder.start()
    MediaUtils.getUserMedia(enableVideo, true, function (err, stream) {
        if(!stream) return
            // 将音频流连接到AudioContext
            // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // const source = audioContext.createMediaStreamSource(stream);
            // const analyser = audioContext.createAnalyser();
            // analyser.fftSize = 256;
            // source.connect(analyser);
        
            // const dataArray = new Uint8Array(analyser.frequencyBinCount);
            // let aloudCount = 0
            // let silenceCount = 0
            // function updateVolume() {
            //   analyser.getByteFrequencyData(dataArray);
        
            //   // 计算音量的平均值
            //   // 计算频谱数据中振幅的平均值
            //     let sum = 0;
            //     dataArray.forEach(value => sum += value);
            //     const averageAmplitude = sum / dataArray.length;
            //     if(averageAmplitude > 20) {
            //         silenceCount = 0
            //         console.log('说话中...');
            //         aloudCount++
            //     }else {
            //         silenceCount++
            //     }
            //     if(silenceCount > 5 && aloudCount > 3) {
            //         aloudCount = 0
            //         console.log('保存录音');
            //         stopRecord()
            //         startRecord()
            //     }
            // }
        
            // // 启动 AudioContext
            // audioContext.resume().then(function() {
            //   // 开始更新音量值
            //   setInterval(() => {
            //     updateVolume();
            //   }, 100)
            // });

        if (err) {
            throw err;
        } else {
            // 通过 MediaRecorder 记录获取到的媒体流
            recorder = new MediaRecorder(stream);
            mediaStream = stream;
            console.log(stream);
            var chunks = [];
            recorder.ondataavailable = function(e) {
                console.log(needSave);
                if(!needSave) return
                recorderFile = new Blob([e.data], { 'type' : 'webm' });
                console.log('change',e);
                sendAudioMessage(recorderFile)
                needSave = false
            };
            recorder.onstop = function (e) {
                recorderFile = new Blob(chunks, { 'type' : recorder.mimeType });
                chunks = [];
                if (null != stopRecordCallback) {
                    stopRecordCallback();
                }
            };
            recorder.start();
        }
    });
}

var volumeRecorder
var volumeTimer

function listenVolumn(enableVideo) {
    videoEnabled = enableVideo;
    // voice.play()
    // polywad.play()
    // polywad.recorder.start()
    MediaUtils.getUserMedia(enableVideo, true, function (err, stream) {
        console.log(err,stream);
        if(!stream) return
            // 将音频流连接到AudioContext
            volumeRecorder = new MediaRecorder(stream);
            volumeRecorder.start();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
        
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let aloudCount = 0
            let silenceCount = 0
            function updateVolume() {
              analyser.getByteFrequencyData(dataArray);
        
              // 计算音量的平均值
              // 计算频谱数据中振幅的平均值
                let sum = 0;
                dataArray.forEach(value => sum += value);
                const averageAmplitude = sum / dataArray.length;
                if(averageAmplitude > 20) {
                    console.log(recorder.state);
                    if(recorder.state === 'inactive') {
                        recorder.start()
                    }
                    silenceCount = 0
                    console.log('说话中...');
                    aloudCount++
                }else {
                    silenceCount++
                    console.log(recorder.state);
                    if(silenceCount > 6) {
                        aloudCount = 0
                        recorder.stop()
                    }
                }
                if(silenceCount > 5 && aloudCount > 3) {
                    aloudCount = 0
                    console.log('保存录音');
                    needSave = true
                    recorder.stop()
                }
            }
        
            // 启动 AudioContext
            audioContext.resume().then(function() {
              // 开始更新音量值
              volumeTimer = setInterval(() => {
                updateVolume();
              }, 100)
            });
    });
}

// 停止录制
function stopRecord(callback) {
    stopRecordCallback = callback;
    // 终止录制器
    recorder.stop();
    // 关闭媒体流
    MediaUtils.closeStream(mediaStream);

    // polywad.stop()
    clearInterval(volumeTimer)
    volumeRecorder.stop()
}

// 播放录制的音频
function playRecord() {
    var url = URL.createObjectURL(recorderFile);
    console.log(recorderFile, url);
    sendAudio(recorderFile)
    var dom = document.createElement(videoEnabled ? 'video' : 'audio');
    dom.autoplay = true;
    dom.src = url;
    if (videoEnabled) {
        dom.width = 640;
        dom.height = 480;
        dom.style.zIndex = '9999999';
        dom.style.position = 'fixed';
        dom.style.left = '0';
        dom.style.right = '0';
        dom.style.top = '0';
        dom.style.bottom = '0';
        dom.style.margin = 'auto';
        document.body.appendChild(dom);
    }
}

document.querySelector('#record-start').addEventListener('click', () => {
    listenVolumn(false)
    startRecord(false);
    console.log('开始录音');
})
document.querySelector('#record-stop').addEventListener('click', () => {
    stopRecord(function() {
        // 播放
        playRecord();
        stopSendAudio()
    });
    console.log('结束录音');

})
document.querySelector('#chat').addEventListener('click', () => {
    const message = document.querySelector('#text').value
    fetch('http://192.168.31.109:3000/send-text', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({message})
    }).then((res) => {
        console.log(res);
        if(res.ok) {
            res.json().then(res => {
                console.log(res);
                document.querySelector('#result').innerText = res.content
              })
        }
    })
})

function sendAudio(audio) {
    var formData = new FormData();
    formData.append('audio', audio, 'recording.webm');
    fetch('http://192.168.31.109:3000/recoganize', {
        method: 'POST',
        body: formData
    }).then(function(response) {
        if (response.ok) {
          console.log('音频上传成功！');
          response.json().then(res => {
            console.log(res);
            document.querySelector('#result').innerText = res.content
          })
        } else {
          console.error('音频上传失败，状态码：' + response.status);
        }
      })
      .catch(function(error) {
        console.error('发生错误：', error);
      });
}

// var data = new FormData();

// data.append("username", "test");
// data.append("userfile", recorderFile);

// var req = new XMLHttpRequest();
// req.open("POST", "http://xxx/xxx");
// req.send(data);
} catch (error) {
    alert(error)
}
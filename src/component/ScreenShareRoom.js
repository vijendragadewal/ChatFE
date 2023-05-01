import React, { useState, useEffect, useRef } from "react";
// import { capture } from "../capture";
import { Button } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import DialogTitle from '@mui/material/DialogTitle'
import Dialog from '@mui/material/Dialog'
import { takescreenshot } from "./ScreenShot";
import { Peer } from 'peerjs'
import './ChatRoom.css'

navigator.getUserMedia = (
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia
)
let currentPeer
let isScreenShared = false


const ChatRoom = ({ io, userName }) => {
  const socket = io('http://192.168.1.5:3001')
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  // const [room, setRoom] = useState('');
  const [imgSrc, setImgSrc] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [showLiveUsers, setShowLiveUsers] = useState(false);
  const [isQuickView, setIsQuickView] = useState(false);
  const [ssImg, setImg] = useState('');
  const [screenShotToReqUser, setScreenShotToReqUser] = useState('');

  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerIdValue] = useState('');
  const remoteVideoRef = useRef(null)
  const currentUserVideoRef = useRef(null)
  const peerInstance = useRef(null)

  useEffect(() => {
    const peer = new Peer()
    peer.on('open', (id) => {
      setPeerId(id)
      socket.emit('newConnection', { username: userName, peerId: id })
    })
    peer.on('call', (call) => {
      navigator.getUserMedia({ video: true, audio: false }, (mediaStream) => {
        currentUserVideoRef.current.srcObject = mediaStream
        currentUserVideoRef.current.play()
        call.answer(mediaStream)
        call.on('stream', function (remotestream) {
          remoteVideoRef.current.srcObject = remotestream
          remoteVideoRef.current.play()
          currentPeer = call.peerConnection
        })
      })
    })
    peerInstance.current = peer
  }, []);

  const callPeer = (remotePeerId) => {
    navigator.getUserMedia({ video: true, audio: false }, (mediaStream) => {
      currentUserVideoRef.current.srcObject = mediaStream
      currentUserVideoRef.current.play()
      const call = peerInstance.current.call(remotePeerId, mediaStream)
      call.on('stream', function (remotestream) {
        remoteVideoRef.current.srcObject = remotestream
        remoteVideoRef.current.play()
        currentPeer = call.peerConnection
      })
    })
  }
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true)
    })
    socket.on('users', (users) => {
      setUsers(users)
    })
    socket.on('messages', (mg) => {
      const msg = messages.slice()
      msg.push(mg)
      setMessages(msg)
    })
    socket.on('recieveScreenShare', async ({ _userName, screenStream }) => {
      if (userName === _userName) {
        const _screenStream = JSON.parse(screenStream)
        setVideoSrc(_screenStream)
      }
    })
    socket.on('disconnect', () => {
      setIsConnected(false)
      socket.emit('disconnectUser', { username: userName })
    })
    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [messages]);

  useEffect(() => {
    socket.on('screenshot', (userDetails) => {
      if (peerId === userDetails?.peerId) {
        takescreenshot()
          .then(image => {
            socket.emit('sendScreenshot', { userName: userDetails.userName, imgSrc: image })
          }).catch(err => console.log('error', err))
      }
    })
    socket.on('receiveScreenshot', (userScreenData) => {
      setScreenShotToReqUser(userScreenData.useName)
      setImgSrc(userScreenData.imgSrc)
      setIsQuickView(false)
    })
  }, [peerId]);

  socket.on('screenShare', async (userDetails) => {
    if (currentPeer && !isScreenShared && peerId === userDetails.peerId) {
      navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      }).then((stream) => {
        let videoTrack = stream.getVideoTracks()[0]
        let sender = currentPeer.getSenders().find(s => {
          return s.track.kind === videoTrack.kind
        })
        sender.replaceTrack(videoTrack)
      }).catch(err => console.log('Screen share issue error --', err))
      isScreenShared = true
    }

  })

  const onChangeMsg = e => setMsg(e.target.value)

  const sendMsgHandler = () => {
    socket.emit('chatMessage', { msg, userName })
    setMsg('')
  }

  const screenShot = () => {
    setIsQuickView(true)
    setShowLiveUsers(true)
  }

  const screenLiveView = () => {
    setIsQuickView(false)
    setShowLiveUsers(true)
  }

  const onClickLiveUser = (user) => {
    setRemotePeerIdValue(user.peerId)
    callPeer(user.peerId)
    if (isQuickView) {
      setTimeout(() => {
        socket.emit('takeScreenshot', { userName, peerId: user.peerId })
      }, 2000);
    } else {
      setTimeout(() => {
        socket.emit('takeScreenShare', { userName, peerId: user.peerId })
      }, 2000);
    }
    setIsQuickView(false)
    setShowLiveUsers(false)
  }
  const user = users.filter(user => user.peerId === remotePeerId)

  console.log('users', users)
  return (<div className="chat-container">
    <div className="chat-window">
      <div className="chat-messages">
        <h2>Welcome {userName}
          <button className="chat-button" onClick={screenShot}>Quick View</button>
          <button className="chat-button" onClick={screenLiveView}>Live View</button>
        </h2>
        <canvas style={{ display: 'none' }} id='canvasImg'></canvas>
        {
          ssImg && userName === screenShotToReqUser &&
          <div style={{ width: '100%', height: '100%', margin: '1%' }}>
            <h3>Screenshot</h3>
            <img src={ssImg} alt='' />
          </div>
        }
        <Dialog onClose={() => setShowLiveUsers(false)} open={showLiveUsers}>
          <DialogTitle> Available Live Users</DialogTitle>
          <List sx={{ pt: 0 }}>
            {users.map((user) => (
              user.peerId === peerId ? null : <ListItem onClick={() => onClickLiveUser(user)} key={user.peerId}>
                <ListItemText primary={user.username} />
              </ListItem>
            ))}
          </List>
        </Dialog>
        <div className="messageList">
          <h3>Welcome to chat. There are {users.length} users connected.</h3>
          {messages.length > 0 && messages.map(({ msg: message, userName: _userName }) => (
            <li style={{ display: 'flex', justifyContent: userName === _userName && 'end' }}>
              <span>{message}</span>
            </li>
          ))}
          <div style={{ display: 'table-caption', textAlign: 'center' }}>
            <div style={{ display: 'none' }}>
              currentUserVideoRef
              <video ref={currentUserVideoRef} height={400} width={400} />
            </div>
            <div>
              {user && user[0]?.username && <>Remote video of {user && user[0]?.username}</>}
              <video ref={remoteVideoRef} />
            </div>
          </div>
          {imgSrc && <img src={imgSrc} alt='' />}
          {videoSrc && <video autoPlay src={videoSrc} />}
        </div>
      </div>
      <div className="chat-form">
        <input className="chat-input" onChange={onChangeMsg} value={msg} />
        <button className="chat-button" onClick={sendMsgHandler}>Send</button>
      </div>
    </div>
    <div className="user-list">
      <Button defaultValue={'Join Room 1'} />
      <h2>User List</h2>
      {users.length > 0 && users.map((user) => (
        <li key={user.username}>{user.username}
          {user.status && <span style={{ border: '1px solid green', borderRadius: '50%', marginLeft: '10px' }} ></span>}
        </li>
      ))}
    </div>
  </div>);
}


export default ChatRoom;
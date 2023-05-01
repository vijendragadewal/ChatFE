import { useState } from 'react';
import './App.css';
import UserForm from './component/UserForm';
import ChatRoom from './component/ScreenShareRoom';
import io from 'socket.io-client'

function App() {
  const [userName, setUserName] = useState('');
  return (
    <>
      {!userName && <UserForm setUser={setUserName} />}
      {userName && <ChatRoom userName={userName} io={io} />}
    </>
  );
}

export default App;

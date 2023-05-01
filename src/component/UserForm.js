import React, { useState } from "react";
import './UserForm.css'

const UserFrom = ({ setUser }) => {
  const [userName, setuserName] = useState('');
  const onChangeHandler = (e) => {
    setuserName(e.target.value)
  }
  const onSubmitHandler = () => {
    if (userName === '') {
      return
    }
    setUser(userName)
  }
  return (<div className="container">
    <div className="userForm">
      <h2>Welcome to Chat Room</h2>
      <input type={'text'} value={userName} placeholder='Enter Username' onKeyUp={(event) => event.key === 'Enter' && onSubmitHandler()} onChange={onChangeHandler} />
      <button onClick={onSubmitHandler}>Enter Chatroom</button>
    </div>
  </div>);
}

export default UserFrom;
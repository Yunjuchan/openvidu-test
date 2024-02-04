// import { OpenVidu } from 'openvidu-browser';
// import axios from 'axios';
// import React, { useState, useEffect } from 'react';
// import './App.css';
// import UserVideoComponent from './UserVideoComponent';
// import
// const OPENVIDU_SERVER_URL = 'https://i10c208.p.ssafy.io:8443';
// const OPENVIDU_SERVER_SECRET = 'MALITELL';

// interface AppState {
//     mySessionId: string;
//     myUserName: string;
//     session?: OpenVidu.Session;
//     mainStreamManager?: OpenVidu.StreamManager;
//     publisher?: OpenVidu.Publisher;
//     subscribers: OpenVidu.StreamManager[];
// }

// const App = () => {
//     const [mySessionId, setMySessionId] = useState<string>('SessionA');
//     const [myUserName, setMyUserName] = useState<string>('Participant' + Math.floor(Math.random() * 100));
//     const [session, setSession] = useState<OpenVidu.Session | undefined>(undefined);
//     const [mainStreamManager, setMainStreamManager] = useState<OpenVidu.StreamManager | undefined>(undefined);
//     const [publisher, setPublisher] = useState<OpenVidu.Publisher | undefined>(undefined);
//     const [subscribers, setSubscribers] = useState<OpenVidu.StreamManager[]>([]);

//     useEffect(() => {
//         const handleBeforeUnload = () => {
//             leaveSession();
//         };

//         window.addEventListener('beforeunload', handleBeforeUnload);

//         return () => {
//             window.removeEventListener('beforeunload', handleBeforeUnload);
//         };
//     }, []);

//     const onBeforeUnload = () => {
//         leaveSession();
//     };

//     const handleChangeSessionId = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setMySessionId(e.target.value);
//     };

//     const handleChangeUserName = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setMyUserName(e.target.value);
//     };

//     const handleMainVideoStream = (stream: OpenVidu.StreamManager) => {
//         if (mainStreamManager !== stream) {
//             setMainStreamManager(stream);
//         }
//     };

//     const joinSession = () => {
//         // ... (이하 생략)
//     };

//     const leaveSession = () => {
//         // ... (이하 생략)
//     };

//     const switchCamera = () => {
//         // ... (이하 생략)
//     };

//     return (
//         <div className="container">
//             {session === undefined ? (
//                 <div id="join">
//                     {/* ... (이하 생략) */}
//                 </div>
//             ) : null}

//             {session !== undefined ? (
//                 <div id="session">
//                     {/* ... (이하 생략) */}
//                 </div>
//             ) : null}
//         </div>
//     );
// };

// export default App;
import React from 'react'

export default function demo() {
  return (
    <div>demo</div>
  )
}

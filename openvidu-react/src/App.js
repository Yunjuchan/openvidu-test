import { OpenVidu } from 'openvidu-browser';

import axios from 'axios';
import React, { Component } from 'react';
import './App.css';
import UserVideoComponent from './UserVideoComponent';

// 버전 충돌나면 export NODE_OPTIONS=--openssl-legacy-provider 이거 쉘에 입력하기
const OPENVIDU_SERVER_URL = '모게요';
const OPENVIDU_SERVER_SECRET = 'MALITELL'
class App extends Component {
    constructor(props) {
        super(props);

        // These properties are in the state's component in order to re-render the HTML whenever their values change
        this.state = {
            mySessionId: 'SessionA',
            myUserName: 'Participant' + Math.floor(Math.random() * 100),
            session: undefined,
            mainStreamManager: undefined,  // Main video of the page. Will be the 'publisher' or one of the 'subscribers'
            publisher: undefined,
            subscribers: [],
        };

        this.joinSession = this.joinSession.bind(this);
        this.leaveSession = this.leaveSession.bind(this);
        this.switchCamera = this.switchCamera.bind(this);
        this.handleChangeSessionId = this.handleChangeSessionId.bind(this);
        this.handleChangeUserName = this.handleChangeUserName.bind(this);
        this.handleMainVideoStream = this.handleMainVideoStream.bind(this);
        this.onbeforeunload = this.onbeforeunload.bind(this);
    }

    componentDidMount() {
        window.addEventListener('beforeunload', this.onbeforeunload);
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.onbeforeunload);
    }

    onbeforeunload(event) {
        this.leaveSession();
    }

    handleChangeSessionId(e) {
        this.setState({
            mySessionId: e.target.value,
        });
    }

    handleChangeUserName(e) {
        this.setState({
            myUserName: e.target.value,
        });
    }

    handleMainVideoStream(stream) {
        if (this.state.mainStreamManager !== stream) {
            this.setState({
                mainStreamManager: stream
            });
        }
    }

    deleteSubscriber(streamManager) {
        let subscribers = this.state.subscribers;
        let index = subscribers.indexOf(streamManager, 0);
        if (index > -1) {
            subscribers.splice(index, 1);
            this.setState({
                subscribers: subscribers,
            });
        }
    }

    
    joinSession() {
        // --- 1) Get an OpenVidu object ---

        this.OV = new OpenVidu();
        // --- 2) Init a session ---

        this.setState(
            {
                session: this.OV.initSession(),
            },
            () => {
                var mySession = this.state.session;

                // --- 3) Specify the actions when events take place in the session ---

                // On every new Stream received...
                mySession.on('streamCreated', (event) => {
                    // Subscribe to the Stream to receive it. Second parameter is undefined
                    // so OpenVidu doesn't create an HTML video by its own
                    var subscriber = mySession.subscribe(event.stream, undefined);
                    var subscribers = this.state.subscribers;
                    subscribers.push(subscriber);

                    // Update the state with the new subscribers
                    this.setState({
                        subscribers: subscribers,
                    });
                });

                // On every Stream destroyed...
                mySession.on('streamDestroyed', (event) => {

                    // Remove the stream from 'subscribers' array
                    this.deleteSubscriber(event.stream.streamManager);
                });

                // On every asynchronous exception...
                mySession.on('exception', (exception) => {
                    console.warn(exception);
                });

                // --- 4) Connect to the session with a valid user token ---

                // Get a token from the OpenVidu deployment
                this.getToken().then((token) => {
                    // First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
                    // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
                    mySession.connect(token.token, { clientData: this.state.myUserName })
                        .then(async () => {

                            // --- 5) Get your own camera stream ---

                            // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
                            // element: we will manage it on our own) and with the desired properties
                            let publisher = await this.OV.initPublisherAsync(undefined, {
                                audioSource: undefined, // The source of audio. If undefined default microphone
                                videoSource: undefined, // The source of video. If undefined default webcam
                                publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
                                publishVideo: true, // Whether you want to start publishing with your video enabled or not
                                resolution: '640x480', // The resolution of your video
                                frameRate: 30, // The frame rate of your video
                                insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
                                mirror: false, // Whether to mirror your local video or not
                            });

                            // --- 6) Publish your stream ---

                            mySession.publish(publisher);

                            // Obtain the current video device in use
                            var devices = await this.OV.getDevices();
                            var videoDevices = devices.filter(device => device.kind === 'videoinput');
                            var currentVideoDeviceId = publisher.stream.getMediaStream().getVideoTracks()[0].getSettings().deviceId;
                            var currentVideoDevice = videoDevices.find(device => device.deviceId === currentVideoDeviceId);

                            // Set the main video in the page to display our webcam and store our Publisher
                            this.setState({
                                currentVideoDevice: currentVideoDevice,
                                mainStreamManager: publisher,
                                publisher: publisher,
                            });
                        })
                        .catch((error) => {
                            console.log('There was an error connecting to the session:', error.code, error.message);
                        });
                });
            },
        );
    }

    leaveSession() {

        // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

        const mySession = this.state.session;

        if (mySession) {
            mySession.disconnect();
        }

        // Empty all properties...
        this.OV = null;
        this.setState({
            session: undefined,
            subscribers: [],
            mySessionId: 'SessionA',
            myUserName: 'Participant' + Math.floor(Math.random() * 100),
            mainStreamManager: undefined,
            publisher: undefined
        });
    }

    async switchCamera() {
        try {
            const devices = await this.OV.getDevices()
            var videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices && videoDevices.length > 1) {

                var newVideoDevice = videoDevices.filter(device => device.deviceId !== this.state.currentVideoDevice.deviceId)

                if (newVideoDevice.length > 0) {
                    // Creating a new publisher with specific videoSource
                    // In mobile devices the default and first camera is the front one
                    var newPublisher = this.OV.initPublisher(undefined, {
                        videoSource: newVideoDevice[0].deviceId,
                        publishAudio: true,
                        publishVideo: true,
                        mirror: true
                    });

                    //newPublisher.once("accessAllowed", () => {
                    await this.state.session.unpublish(this.state.mainStreamManager)

                    await this.state.session.publish(newPublisher)
                    this.setState({
                        currentVideoDevice: newVideoDevice[0],
                        mainStreamManager: newPublisher,
                        publisher: newPublisher,
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    render() {
        const mySessionId = this.state.mySessionId;
        const myUserName = this.state.myUserName;

        return (
            <div className="container">
                {this.state.session === undefined ? (
                    <div id="join">
                        <div id="img-div">
                            <img src="resources/images/openvidu_grey_bg_transp_cropped.png" alt="OpenVidu logo" />
                        </div>
                        <div id="join-dialog" className="jumbotron vertical-center">
                            <h1> Join a video session </h1>
                            <form className="form-group" onSubmit={this.joinSession}>
                                <p>
                                    <label>Participant: </label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        id="userName"
                                        value={myUserName}
                                        onChange={this.handleChangeUserName}
                                        required
                                    />
                                </p>
                                <p>
                                    <label> Session: </label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        id="sessionId"
                                        value={mySessionId}
                                        onChange={this.handleChangeSessionId}
                                        required
                                    />
                                </p>
                                <p className="text-center">
                                    <input className="btn btn-lg btn-success" name="commit" type="submit" value="JOIN" />
                                </p>
                            </form>
                        </div>
                    </div>
                ) : null}

                {this.state.session !== undefined ? (
                    <div id="session">
                        <div id="session-header">
                            <h1 id="session-title">{mySessionId}</h1>
                            <input
                                className="btn btn-large btn-danger"
                                type="button"
                                id="buttonLeaveSession"
                                onClick={this.leaveSession}
                                value="Leave session"
                            />
                            <input
                                className="btn btn-large btn-success"
                                type="button"
                                id="buttonSwitchCamera"
                                onClick={this.switchCamera}
                                value="Switch Camera"
                            />
                        </div>

                        {/* {this.state.mainStreamManager !== undefined ? (
                            <div id="main-video" className="col-md-6">
                                <UserVideoComponent streamManager={this.state.mainStreamManager} />

                            </div>
                        ) : null} */}
                        <div id="video-container" className="col-md-6">
                            {this.state.publisher !== undefined ? (
                                <div className="stream-container col-md-6 col-xs-6" onClick={() => this.handleMainVideoStream(this.state.publisher)}>
                                    <UserVideoComponent
                                        streamManager={this.state.publisher} />
                                </div>
                            ) : null}
                            {this.state.subscribers.map((sub, i) => (
                                <div key={sub.id} className="stream-container col-md-6 col-xs-6" onClick={() => this.handleMainVideoStream(sub)}>
                                    <span>{sub.id}</span>
                                    <UserVideoComponent streamManager={sub} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }


    /**
     * --------------------------------------------
     * GETTING A TOKEN FROM YOUR APPLICATION SERVER
     * --------------------------------------------
     * The methods below request the creation of a Session and a Token to
     * your application server. This keeps your OpenVidu deployment secure.
     *
     * In this sample code, there is no user control at all. Anybody could
     * access your application server endpoints! In a real production
     * environment, your application server must identify the user to allow
     * access to the endpoints.
     *
     * Visit https://docs.openvidu.io/en/stable/application-server to learn
     * more about the integration of OpenVidu in your application server.
     */
    // async getToken() {
    //     const sessionId = await this.createSession(this.state.mySessionId);
    //     return await this.createToken(sessionId);
    // }

    // 토큰을 얻을 때 세션을 생성하기 전에 동일한 이름의 세션이 존재하는지 확인
    async getToken() {
        // Check if the session already exists
        const existingSession = await this.getSession();
        
        // If the session exists, return the token without creating a new session
        if (existingSession) {
            return this.createToken(existingSession);
        } else {
            // If the session doesn't exist, create a new session and return the token
            const newSession = await this.createSession(this.state.mySessionId);
            return this.createToken(newSession);
        }
    }
    
    // Add a new method to check if the session exists
    async getSession() {
        try {
            const response = await axios.get(
                `${OPENVIDU_SERVER_URL}/openvidu/api/sessions/${this.state.mySessionId}`,
                {
                    headers: {
                        Authorization: `Basic ${btoa(`OPENVIDUAPP:${OPENVIDU_SERVER_SECRET}`)}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data; // Return the existing session details if it exists
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null; // Session not found
            } else {
                throw error; // Other error, re-throw it
            }
        }
    }

    async createSession(sessionId) {
        const response = await axios.post(
            `${OPENVIDU_SERVER_URL}/openvidu/api/sessions`,
            { customSessionId: sessionId },
            {
                headers: {
                    // Authorization: `Basic OPENVIDUAPP:${btoa(OPENVIDU_SERVER_SECRET)}`,
                    Authorization: `Basic ${btoa(
                        `OPENVIDUAPP:${OPENVIDU_SERVER_SECRET}`,
                    )}`,
                    'Content-Type': 'application/json',
                },
            },
        );
        return response.data; // The sessionId
    }

    async createToken(sessionId) {
        const data = {};
        const response = await axios
            .post(
                `${OPENVIDU_SERVER_URL}/openvidu/api/sessions/${sessionId.sessionId}/connection`,
                data,
                {
                    headers: {
                        // Authorization: `Basic OPENVIDUAPP:${btoa(OPENVIDU_SERVER_SECRET)}`,
                        Authorization: `Basic ${btoa(
                            `OPENVIDUAPP:${OPENVIDU_SERVER_SECRET}`,
                        )}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
        return response.data; // The token
    }
}

export default App;
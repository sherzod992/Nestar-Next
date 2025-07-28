import React, { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, Box, Stack } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import Badge from "@mui/material/Badge";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import MarkChatUnreadIcon from "@mui/icons-material/MarkChatUnread";
import { useRouter } from "next/router";
import ScrollableFeed from "react-scrollable-feed";
import { RippleBadge } from "../../scss/MaterialTheme/styled";
import { useReactiveVar } from "@apollo/client";
import { socketVar, userVar } from "../../apollo/store";
import { Member } from "../types/member/member";
import { Messages, REACT_APP_API_URL } from "../config";
import { sweetErrorAlert } from "../sweetAlert";
import { getJwtToken } from "../auth";

const NewMessage = (type: any) => {
  if (type === "right") {
    return (
      <Box
        component={"div"}
        flexDirection={"row"}
        style={{ display: "flex" }}
        alignItems={"flex-end"}
        justifyContent={"flex-end"}
        sx={{ m: "10px 0px" }}
      >
        <div className={"msg_right"}></div>
      </Box>
    );
  } else {
    return (
      <Box
        flexDirection={"row"}
        style={{ display: "flex" }}
        sx={{ m: "10px 0px" }}
        component={"div"}
      >
        <Avatar alt={"jonik"} src={"/img/profile/defaultUser.svg"} />
        <div className={"msg_left"}></div>
      </Box>
    );
  }
};
interface MessagePayload {
  event: string;
  text: string;
  memberData: Member;
  timestamp?: string;
}

interface InfoPayload {
  event: string;
  totalClients: number;
  memeberData: Member;
  action: string;
}

const Chat = () => {
  const chatContentRef = useRef<HTMLDivElement>(null);
  const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [messageInput, setMessageInput] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [openButton, setOpenButton] = useState(false);
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const socket = useReactiveVar(socketVar);

  /** LIFECYCLES **/

  useEffect(() => {
    console.log('🔍 Chat 컴포넌트 디버깅:');
    console.log('- 현재 사용자:', user);
    console.log('- Socket 상태:', socket?.readyState);
    console.log('- Socket URL:', socket?.url);
    console.log('- 환경 변수 REACT_APP_API_WS:', process.env.REACT_APP_API_WS);
    
    // WebSocket이 없거나 연결이 끊어진 경우 재연결 시도
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      console.log('🔄 WebSocket 재연결 시도...');
      const wsUrl = process.env.REACT_APP_API_WS?.replace('/graphql', '/chat') || 'ws://localhost:3007/chat';
      const token = getJwtToken() || '';
      const fullWsUrl = token ? `${wsUrl}?token=${token}` : wsUrl;
      
      try {
        const newSocket = new WebSocket(fullWsUrl);
        socketVar(newSocket);
        
        newSocket.onopen = () => {
          console.log('✅ Chat WebSocket 연결됨');
        };
        
        newSocket.onerror = (error) => {
          console.error('❌ Chat WebSocket 오류:', error);
        };
        
        newSocket.onclose = () => {
          console.log('🔌 Chat WebSocket 연결 종료');
        };
      } catch (error) {
        console.error('❌ WebSocket 생성 오류:', error);
      }
      return;
    }

    socket.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        console.log('📨 WebSocket 메시지 수신:', data);

        switch (data.event) {
          case 'info':
            console.log('👥 온라인 사용자 정보:', data);
            setOnlineUsers(data.totalClients);
            break;
          case 'getMessages':
            console.log('📝 기존 메시지 목록:', data.list);
            setMessagesList(data.list || []);
            break;
          case 'message':
            console.log('💬 새 메시지:', data);
            console.log('💬 멤버 데이터:', data.memberData);
            setMessagesList((prev) => [...prev, data]);
            break;
          default:
            console.log('❓ 알 수 없는 이벤트:', data.event);
        }
      } catch (e) {
        console.error('❌ WebSocket 파싱 오류:', e);
        console.error('❌ 원본 메시지:', msg.data);
      }
    };

    socket.onopen = () => {
      console.log('✅ WebSocket 연결됨');
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket 오류:', error);
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket 연결 종료');
    };

  }, [socket, user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setOpenButton(true);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    setOpenButton(false);
  }, [router.pathname]);

  /** HANDLERS **/
  const handleOpenChat = () => {
    setOpen((prevState) => !prevState);
  };

  const getInputMessageHandler = useCallback(
    (e: any) => {
      const text = e.target.value;
      setMessageInput(text);
    },
    [messageInput]
  );

  const getKeyHandler = (e: any) => {
    try {
      if (e.key == "Enter") {
        onClickHandler();
      }
    } catch (err: any) {
      console.log(err);
    }
  };

  const onClickHandler = () => {
    if (!messageInput) {
      sweetErrorAlert(Messages.error4);
      return;
    }
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket이 연결되지 않았습니다');
      sweetErrorAlert('채팅 서버에 연결할 수 없습니다');
      return;
    }

    if (!user?._id) {
      console.error('❌ 사용자가 로그인되지 않았습니다');
      sweetErrorAlert('로그인이 필요합니다');
      return;
    }

    const messageData = {
      event: "message",
      data: messageInput,
      memberData: user
    };

    console.log('📤 메시지 전송:', messageData);
    socket.send(JSON.stringify(messageData));
    setMessageInput("");
  };

  return (
    <Stack className="chatting">
      {openButton ? (
        <button className="chat-button" onClick={handleOpenChat}>
          {open ? <CloseFullscreenIcon /> : <MarkChatUnreadIcon />}
        </button>
      ) : null}
      <Stack className={`chat-frame ${open ? "open" : ""}`}>
        <Box className={"chat-top"} component={"div"}>
          <div style={{ fontFamily: "Nunito" }}>Online Chat</div>
          <RippleBadge
            style={{ margin: "-18px 0 0 21px" }}
            badgeContent={onlineUsers}
          />
        </Box>
        <Box
          className={"chat-content"}
          id="chat-content"
          ref={chatContentRef}
          component={"div"}
        >
          <ScrollableFeed>
            <Stack className={"chat-main"}>
              <Box
                flexDirection={"row"}
                style={{ display: "flex" }}
                sx={{ m: "10px 0px" }}
                component={"div"}
              >
                <div className={"welcome"}>Welcome to Live chat!</div>
              </Box>
              {messagesList.map((ele: MessagePayload, index: number) => {
                console.log(`💬 메시지 ${index}:`, ele);
                const { text, memberData } = ele;
                
                if (!memberData) {
                  console.warn(`⚠️ 메시지 ${index}에 멤버 데이터가 없습니다:`, ele);
                  return null;
                }

                const memberImage = memberData?.memberImage
                  ? `${REACT_APP_API_URL}/${memberData.memberImage}`
                  : "/img/profile/defaultUser.svg";
                
                const isCurrentUser = memberData?._id === user?._id;
                console.log(`👤 메시지 작성자: ${memberData.memberNick} (현재 사용자: ${isCurrentUser})`);

                return isCurrentUser ? (
                  <Box
                    key={index}
                    component={"div"}
                    flexDirection={"row"}
                    style={{ display: "flex" }}
                    alignItems={"flex-end"}
                    justifyContent={"flex-end"}
                    sx={{ m: "10px 0px" }}
                  >
                    <div className={"msg-right"}>{text}</div>
                  </Box>
                ) : (
                  <Box
                    key={index}
                    flexDirection={"row"}
                    style={{ display: "flex" }}
                    sx={{ m: "10px 0px" }}
                    component={"div"}
                  >
                    <Avatar alt={memberData.memberNick || "User"} src={memberImage} />
                    <div className={"msg-left"}>
                      <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}>
                        {memberData.memberNick || "Unknown User"}
                      </div>
                      <div>{text}</div>
                    </div>
                  </Box>
                );
              })}
            </Stack>
          </ScrollableFeed>
        </Box>
        <Box className={"chat-bott"} component={"div"}>
          <input
            type={"text"}
            name={"message"}
            className={"msg-input"}
            placeholder={"Type message"}
            value={messageInput}
            onChange={getInputMessageHandler}
            onKeyDown={getKeyHandler}
          />
          <button
            className={"send-msg-btn"}
            onClick={onClickHandler}
            disabled={!socket || socket.readyState !== WebSocket.OPEN || !user?._id}
          >
            <SendIcon style={{ color: "#fff" }} />
          </button>
        </Box>
      </Stack>
    </Stack>
  );
};

export default Chat;
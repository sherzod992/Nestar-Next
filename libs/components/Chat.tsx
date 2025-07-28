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
  if (!socket) return; 

  socket.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      console.log('📨 WebSocket 메시지 수신:', data);

      // 메시지 타입 검증
      if (!data || typeof data !== 'object') {
        console.warn('⚠️ 잘못된 메시지 형식:', data);
        return;
      }

      switch (data.event) {
        case 'info':
          console.log('👥 온라인 사용자 정보:', data);
          setOnlineUsers(data.totalClients || 0);
          break;
        case 'getMessages':
          console.log('💬 메시지 목록 수신:', data.list);
          setMessagesList(data.list || []);
          break;
        case 'message':
          console.log('💭 새 메시지 수신:', data);
          setMessagesList((prev) => [...prev, data]);
          break;
        default:
          console.warn('⚠️ 알 수 없는 메시지 타입:', data.event, data);
          break;
      }
    } catch (e) {
      console.error('❌ WebSocket 메시지 파싱 오류:', e);
      console.error('❌ 원본 메시지:', msg.data);
    }
  };
}, [socket]); 

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
      console.warn('⚠️ WebSocket이 연결되지 않았습니다.');
      sweetErrorAlert('채팅 서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    try {
      socket.send(JSON.stringify({ event: "message", data: messageInput }));
      setMessageInput("");
    } catch (error) {
      console.error('❌ 메시지 전송 오류:', error);
      sweetErrorAlert('메시지 전송에 실패했습니다.');
    }
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
          <div style={{ fontFamily: "Nunito" }}>
            Online Chat
            {socket && socket.readyState === WebSocket.OPEN ? (
              <span style={{ color: '#4caf50', fontSize: '12px', marginLeft: '8px' }}>● 연결됨</span>
            ) : (
              <span style={{ color: '#f44336', fontSize: '12px', marginLeft: '8px' }}>● 연결 안됨</span>
            )}
          </div>
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
              {messagesList.map((ele: MessagePayload) => {
                const { text, memberData } = ele;
                const memberImage = memberData?.memberImage
                  ? `${REACT_APP_API_URL}/${memberData.memberImage}`
                  : "/img/profile/defaultUser.svg";
                return memberData?._id === user?._id ? (
                  <Box
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
                    flexDirection={"row"}
                    style={{ display: "flex" }}
                    sx={{ m: "10px 0px" }}
                    component={"div"}
                  >
                    <Avatar alt={"jonik"} src={memberImage} />
                    <div className={"msg-left"}>{text}</div>
                  </Box>
                );
              })}
              <></>
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
            disabled={!socket || socket.readyState !== WebSocket.OPEN}
          >
            <SendIcon style={{ color: "#fff" }} />
          </button>
        </Box>
      </Stack>
    </Stack>
  );
};

export default Chat;
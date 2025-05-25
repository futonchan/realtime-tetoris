import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type ScreenType = 'start' | 'single-player' | 'multiplayer-rooms' | 'multiplayer-lobby' | 'multiplayer-game' | 'settings';
type Cell = 0 | PieceType;
type Board = Cell[][];
type Position = { x: number, y: number };
type Piece = {
  type: PieceType;
  position: Position;
  rotation: number;
};
type Room = {
  id: string;
  name: string;
  players: string[];
  ready_players: string[];
  game_in_progress: boolean;
};

const PIECES = {
  'I': [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0]
    ]
  ],
  'O': [
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ]
  ],
  'T': [
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0]
    ]
  ],
  'S': [
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0]
    ]
  ],
  'Z': [
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0]
    ]
  ],
  'J': [
    [
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0]
    ]
  ],
  'L': [
    [
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0]
    ]
  ]
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 500; // ms - faster initial speed for standard Tetris feel
const SPEED_INCREASE = 0.8; // 20% faster per level
const LEVEL_LINES = 10; // Lines to clear for next level
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const createEmptyBoard = (): Board => {
  return Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(0));
};

const getRandomPiece = (): PieceType => {
  const pieces: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return pieces[Math.floor(Math.random() * pieces.length)];
};

const canPieceMove = (board: Board, piece: Piece, moveX: number, moveY: number): boolean => {
  const pieceShape = PIECES[piece.type][piece.rotation];
  
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (pieceShape[y][x]) {
        const newX = piece.position.x + x + moveX;
        const newY = piece.position.y + y + moveY;
        
        if (newX < 0 || newX >= BOARD_WIDTH || newY < 0 || newY >= BOARD_HEIGHT) {
          return false;
        }
        
        if (board[newY][newX] !== 0) {
          return false;
        }
      }
    }
  }
  
  return true;
};

const canPieceRotate = (board: Board, piece: Piece): boolean => {
  const newRotation = (piece.rotation + 1) % 4;
  const pieceShape = PIECES[piece.type][newRotation];
  
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (pieceShape[y][x]) {
        const newX = piece.position.x + x;
        const newY = piece.position.y + y;
        
        if (newX < 0 || newX >= BOARD_WIDTH || newY < 0 || newY >= BOARD_HEIGHT) {
          return false;
        }
        
        if (board[newY][newX] !== 0) {
          return false;
        }
      }
    }
  }
  
  return true;
};

const placePieceOnBoard = (board: Board, piece: Piece): Board => {
  const newBoard = board.map(row => [...row]);
  const pieceShape = PIECES[piece.type][piece.rotation];
  
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (pieceShape[y][x]) {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;
        
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = piece.type;
        }
      }
    }
  }
  
  return newBoard;
};

const checkCompletedLines = (board: Board): { newBoard: Board, linesCleared: number } => {
  const newBoard = board.filter(row => !row.every(cell => cell !== 0));
  const linesCleared = board.length - newBoard.length;
  
  const emptyLines = Array(linesCleared).fill(0).map(() => Array(BOARD_WIDTH).fill(0));
  
  return {
    newBoard: [...emptyLines, ...newBoard],
    linesCleared
  };
};

const addGarbageLines = (board: Board, lines: number): Board => {
  const newBoard = board.slice(lines);
  
  const garbageLines = Array(lines).fill(0).map(() => {
    const holePosition = Math.floor(Math.random() * BOARD_WIDTH);
    return Array(BOARD_WIDTH).fill('I' as PieceType).map((_, i) => i === holePosition ? 0 : 'I');
  });
  
  return [...newBoard, ...garbageLines];
};

const calculateScore = (linesCleared: number, level: number): number => {
  const basePoints = [0, 40, 100, 300, 1200];
  return basePoints[Math.min(linesCleared, 4)] * (level + 1);
};

function App() {
  const [screen, setScreen] = useState<ScreenType>('start');
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<PieceType>(getRandomPiece());
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(0);
  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<number>(INITIAL_SPEED);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [opponentBoard, setOpponentBoard] = useState<Board>(createEmptyBoard());
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [opponentName, setOpponentName] = useState<string>('');
  
  const [bgmVolume, setBgmVolume] = useState<number>(50);
  const [seVolume, setSeVolume] = useState<number>(50);
  
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const rotateSound = useRef<HTMLAudioElement | null>(null);
  const dropSound = useRef<HTMLAudioElement | null>(null);
  const clearSound = useRef<HTMLAudioElement | null>(null);
  const gameOverSound = useRef<HTMLAudioElement | null>(null);
  
  const gameLoopRef = useRef<number | null>(null);
  
  const initGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece({
      type: getRandomPiece(),
      position: { x: 3, y: 0 },
      rotation: 0
    });
    setNextPiece(getRandomPiece());
    setScore(0);
    setLevel(0);
    setLinesCleared(0);
    setGameOver(false);
    setGameSpeed(INITIAL_SPEED);
    setIsPaused(false);
    
    if (bgmRef.current) {
      bgmRef.current.volume = bgmVolume / 100;
      bgmRef.current.play();
    }
  }, [bgmVolume]);
  
  const movePiece = useCallback((moveX: number, moveY: number) => {
    if (!currentPiece || gameOver || isPaused) return;
    
    if (canPieceMove(board, currentPiece, moveX, moveY)) {
      setCurrentPiece({
        ...currentPiece,
        position: {
          x: currentPiece.position.x + moveX,
          y: currentPiece.position.y + moveY
        }
      });
      
      if (moveX !== 0 && moveSound.current) {
        moveSound.current.volume = seVolume / 100;
        moveSound.current.currentTime = 0;
        moveSound.current.play();
      }
    } else if (moveY > 0) {
      const newBoard = placePieceOnBoard(board, currentPiece);
      
      if (dropSound.current) {
        dropSound.current.volume = seVolume / 100;
        dropSound.current.currentTime = 0;
        dropSound.current.play();
      }
      
      const { newBoard: boardAfterLineCheck, linesCleared: newLinesCleared } = checkCompletedLines(newBoard);
      
      if (newLinesCleared > 0) {
        if (clearSound.current) {
          clearSound.current.volume = seVolume / 100;
          clearSound.current.currentTime = 0;
          clearSound.current.play();
        }
        
        const newTotalLinesCleared = linesCleared + newLinesCleared;
        const newLevel = Math.floor(newTotalLinesCleared / LEVEL_LINES);
        const newScore = score + calculateScore(newLinesCleared, level);
        
        setLinesCleared(newTotalLinesCleared);
        setLevel(newLevel);
        setScore(newScore);
        setGameSpeed(INITIAL_SPEED * Math.pow(SPEED_INCREASE, newLevel));
        
        if (socket && currentRoom) {
          socket.emit('message', {
            type: 'game_state_update',
            update: {
              type: 'lines_cleared',
              lines_cleared: newLinesCleared
            }
          });
          
          socket.emit('message', {
            type: 'game_state_update',
            update: {
              type: 'score_update',
              score: newScore
            }
          });
        }
      }
      
      setBoard(boardAfterLineCheck);
      
      const newPiece = {
        type: nextPiece,
        position: { x: 3, y: 0 },
        rotation: 0
      };
      
      if (!canPieceMove(boardAfterLineCheck, newPiece, 0, 0)) {
        setGameOver(true);
        
        if (gameOverSound.current) {
          gameOverSound.current.volume = seVolume / 100;
          gameOverSound.current.currentTime = 0;
          gameOverSound.current.play();
        }
        
        if (bgmRef.current) {
          bgmRef.current.pause();
        }
        
        if (socket && currentRoom) {
          socket.emit('message', {
            type: 'game_over'
          });
        }
      } else {
        setCurrentPiece(newPiece);
        setNextPiece(getRandomPiece());
        
        if (socket && currentRoom) {
          socket.emit('message', {
            type: 'game_state_update',
            update: {
              type: 'board_update',
              board: boardAfterLineCheck
            }
          });
        }
      }
    }
  }, [board, currentPiece, gameOver, isPaused, level, linesCleared, nextPiece, score, seVolume, socket, currentRoom]);
  const startGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    gameLoopRef.current = window.setInterval(() => {
      if (!isPaused && !gameOver) {
        movePiece(0, 1);
      }
    }, gameSpeed);
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameSpeed, isPaused, gameOver, movePiece]);

  
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    if (canPieceRotate(board, currentPiece)) {
      setCurrentPiece({
        ...currentPiece,
        rotation: (currentPiece.rotation + 1) % 4
      });
      
      if (rotateSound.current) {
        rotateSound.current.volume = seVolume / 100;
        rotateSound.current.currentTime = 0;
        rotateSound.current.play();
      }
    }
  }, [board, currentPiece, gameOver, isPaused, seVolume]);
  
  const hardDropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let dropDistance = 0;
    while (canPieceMove(board, currentPiece, 0, dropDistance + 1)) {
      dropDistance++;
    }
    
    if (dropDistance > 0) {
      const droppedPiece = {
        ...currentPiece,
        position: {
          x: currentPiece.position.x,
          y: currentPiece.position.y + dropDistance
        }
      };
      
      const newBoard = placePieceOnBoard(board, droppedPiece);
      
      if (dropSound.current) {
        dropSound.current.volume = seVolume / 100;
        dropSound.current.currentTime = 0;
        dropSound.current.play();
      }
      
      const { newBoard: boardAfterLineCheck, linesCleared: newLinesCleared } = checkCompletedLines(newBoard);
      
      if (newLinesCleared > 0) {
        if (clearSound.current) {
          clearSound.current.volume = seVolume / 100;
          clearSound.current.currentTime = 0;
          clearSound.current.play();
        }
        
        const newTotalLinesCleared = linesCleared + newLinesCleared;
        const newLevel = Math.floor(newTotalLinesCleared / LEVEL_LINES);
        const newScore = score + calculateScore(newLinesCleared, level);
        
        setLinesCleared(newTotalLinesCleared);
        setLevel(newLevel);
        setScore(newScore);
        setGameSpeed(INITIAL_SPEED * Math.pow(SPEED_INCREASE, newLevel));
        
        if (socket && currentRoom) {
          socket.emit('message', {
            type: 'game_state_update',
            update: {
              type: 'lines_cleared',
              lines_cleared: newLinesCleared
            }
          });
          
          socket.emit('message', {
            type: 'game_state_update',
            update: {
              type: 'score_update',
              score: newScore
            }
          });
        }
      }
      
      setBoard(boardAfterLineCheck);
      
      const newPiece = {
        type: nextPiece,
        position: { x: 3, y: 0 },
        rotation: 0
      };
      
      if (!canPieceMove(boardAfterLineCheck, newPiece, 0, 0)) {
        setGameOver(true);
        
        if (gameOverSound.current) {
          gameOverSound.current.volume = seVolume / 100;
          gameOverSound.current.currentTime = 0;
          gameOverSound.current.play();
        }
        
        if (bgmRef.current) {
          bgmRef.current.pause();
        }
        
        if (socket && currentRoom) {
          socket.emit('message', {
            type: 'game_over'
          });
        }
      } else {
        setCurrentPiece(newPiece);
        setNextPiece(getRandomPiece());
        
        if (socket && currentRoom) {
          socket.emit('message', {
            type: 'game_state_update',
            update: {
              type: 'board_update',
              board: boardAfterLineCheck
            }
          });
        }
      }
    }
  }, [board, currentPiece, gameOver, isPaused, dropSound, clearSound, gameOverSound, bgmRef, seVolume, linesCleared, level, score, nextPiece, socket, currentRoom]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'single-player' && screen !== 'multiplayer-game') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ':
          hardDropPiece();
          break;
        case 'p':
          setIsPaused(!isPaused);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movePiece, rotatePiece, hardDropPiece, isPaused, screen]);
  
  useEffect(() => {
    if ((screen === 'single-player' || screen === 'multiplayer-game') && !gameOver) {
      return startGameLoop();
    }
  }, [screen, gameOver, startGameLoop]);
  
  useEffect(() => {
    if (screen === 'multiplayer-rooms' && !socket) {
      const newSocket = io(BACKEND_URL);
      
      newSocket.on('connect', () => {
        console.log('Connected to server');
      });
      
      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setScreen('start');
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [screen, socket]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleRoomUpdate = (data: any) => {
      if (data.type === 'room_update') {
        setCurrentRoom(data.room);
      }
    };
    
    const handleGameStarted = (data: any) => {
      if (data.type === 'game_started') {
        setScreen('multiplayer-game');
        initGame();
        
        const players = data.players.filter((name: string) => name !== playerName);
        if (players.length > 0) {
          setOpponentName(players[0]);
        }
      }
    };
    
    const handleGameStateUpdate = (data: any) => {
      if (data.type === 'game_state_update' && data.player !== playerName) {
        if (data.update.type === 'board_update') {
          setOpponentBoard(data.update.board);
        } else if (data.update.type === 'score_update') {
          setOpponentScore(data.update.score);
        }
      }
    };
    
    const handleReceiveGarbage = (data: any) => {
      if (data.type === 'receive_garbage') {
        setBoard(prevBoard => addGarbageLines(prevBoard, data.lines));
      }
    };
    
    const handleGameOver = (data: any) => {
      if (data.type === 'game_over') {
        if (data.loser !== playerName) {
          setGameOver(true);
          
          if (gameOverSound.current) {
            gameOverSound.current.volume = seVolume / 100;
            gameOverSound.current.currentTime = 0;
            gameOverSound.current.play();
          }
          
          if (bgmRef.current) {
            bgmRef.current.pause();
          }
        }
      }
    };
    
    const handleGameEnded = (data: any) => {
      if (data.type === 'game_ended') {
        setScreen('multiplayer-lobby');
        setGameOver(false);
        setIsReady(false);
      }
    };
    
    socket.on('message', (data: any) => {
      console.log('Received message:', data);
      
      switch (data.type) {
        case 'room_update':
          handleRoomUpdate(data);
          break;
        case 'game_started':
          handleGameStarted(data);
          break;
        case 'game_state_update':
          handleGameStateUpdate(data);
          break;
        case 'receive_garbage':
          handleReceiveGarbage(data);
          break;
        case 'game_over':
          handleGameOver(data);
          break;
        case 'game_ended':
          handleGameEnded(data);
          break;
        default:
          break;
      }
    });
    
    return () => {
      socket.off('message');
    };
  }, [socket, playerName, initGame, seVolume]);
  
  useEffect(() => {
    if (screen === 'multiplayer-rooms') {
      const fetchRooms = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/rooms`);
          const data = await response.json();
          setRooms(data);
        } catch (error) {
          console.error('Error fetching rooms:', error);
        }
      };
      
      fetchRooms();
      
      const interval = setInterval(fetchRooms, 5000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [screen]);
  
  useEffect(() => {
    localStorage.setItem('bgmVolume', bgmVolume.toString());
    localStorage.setItem('seVolume', seVolume.toString());
    
    if (bgmRef.current) {
      bgmRef.current.volume = bgmVolume / 100;
    }
  }, [bgmVolume, seVolume]);
  
  useEffect(() => {
    const savedBgmVolume = localStorage.getItem('bgmVolume');
    const savedSeVolume = localStorage.getItem('seVolume');
    
    if (savedBgmVolume) {
      setBgmVolume(parseInt(savedBgmVolume));
    }
    
    if (savedSeVolume) {
      setSeVolume(parseInt(savedSeVolume));
    }
  }, []);
  
  const joinRoom = (roomId: string) => {
    if (!socket || !playerName) return;
    
    socket.emit('message', {
      type: 'join_room',
      room_id: roomId,
      player_name: playerName
    });
    
    setScreen('multiplayer-lobby');
  };
  
  const createRoom = async () => {
    if (!playerName) return;
    
    try {
      const roomId = `room_${Date.now()}`;
      const response = await fetch(`${BACKEND_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: roomId,
          name: `${playerName}'s Room`,
          players: [],
          game_in_progress: false
        })
      });
      
      if (response.ok) {
        joinRoom(roomId);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };
  
  const toggleReady = () => {
    if (!socket || !currentRoom) return;
    
    const newReadyStatus = !isReady;
    
    socket.emit('message', {
      type: 'player_ready',
      ready: newReadyStatus
    });
    
    setIsReady(newReadyStatus);
  };
  
  const renderBoard = (board: Board, isPrimary: boolean = true) => {
    let displayBoard = board.map(row => [...row]);
    
    if (isPrimary && currentPiece && !gameOver) {
      const pieceShape = PIECES[currentPiece.type][currentPiece.rotation];
      
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          if (pieceShape[y][x]) {
            const boardX = currentPiece.position.x + x;
            const boardY = currentPiece.position.y + y;
            
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }
    
    return (
      <div className={isPrimary ? "game-board" : "opponent-board"}>
        {displayBoard.map((row, y) => (
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className={`cell ${cell !== 0 ? `cell-filled piece-${cell}` : ''}`}
            />
          ))
        ))}
      </div>
    );
  };
  
  const renderNextPiece = () => {
    if (!nextPiece) return null;
    
    const pieceShape = PIECES[nextPiece][0];
    
    return (
      <div className="next-piece">
        {pieceShape.map((row, y) => (
          row.map((cell, x) => (
            <div
              key={`next-${y}-${x}`}
              className={`cell ${cell ? `cell-filled piece-${nextPiece}` : ''}`}
            />
          ))
        ))}
      </div>
    );
  };
  
  const renderStartScreen = () => (
    <div className="start-screen">
      <h1 className="game-title">テトリス</h1>
      <button className="menu-button" onClick={() => {
        setScreen('single-player');
        initGame();
      }}>ひとりで</button>
      <button className="menu-button" onClick={() => setScreen('multiplayer-rooms')}>ふたりで</button>
      <button className="menu-button" onClick={() => setScreen('settings')}>設定</button>
    </div>
  );
  
  const renderSinglePlayerScreen = () => (
    <div className="game-container">
      <div style={{ display: 'flex' }}>
        {renderBoard(board)}
        <div className="game-info">
          <h3>Next</h3>
          {renderNextPiece()}
          <div className="score-display">Score: {score}</div>
          <div className="level-display">Level: {level}</div>
          <div className="level-display">Lines: {linesCleared}</div>
          <button className="back-button" onClick={() => {
            setScreen('start');
            if (bgmRef.current) {
              bgmRef.current.pause();
            }
          }}>Back to Menu</button>
          <div className="game-controls">
            <p>← → : Move</p>
            <p>↓ : Soft Drop</p>
            <p>↑ : Rotate</p>
            <p>Space : Hard Drop</p>
            <p>P : Pause</p>
          </div>
        </div>
      </div>
      {gameOver && (
        <div className="game-over">
          <div className="game-over-text">GAME OVER</div>
          <div className="final-score">Score: {score}</div>
          <button className="restart-button" onClick={() => {
            initGame();
          }}>Play Again</button>
          <button className="back-button" onClick={() => {
            setScreen('start');
          }}>Back to Menu</button>
        </div>
      )}
    </div>
  );
  
  const [inputName, setInputName] = useState('');
  
  const renderMultiplayerRoomsScreen = () => (
    <div className="multiplayer-container">
      <h1>Multiplayer Rooms</h1>
      {!playerName ? (
        <div>
          <h2>Enter your name</h2>
          <input
            type="text"
            className="player-name-input"
            placeholder="名前を入力してください (最大20文字)"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            maxLength={20}
          />
          <button
            className="menu-button"
            onClick={() => setPlayerName(inputName)}
            disabled={!inputName}
          >
            OK
          </button>
        </div>
      ) : (
        <>
          <h2>Welcome, {playerName}</h2>
          <button className="menu-button" onClick={createRoom}>Create Room</button>
          <div className="room-list">
            <h3>Available Rooms</h3>
            {rooms.length === 0 ? (
              <p>No rooms available. Create one!</p>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="room-item" onClick={() => joinRoom(room.id)}>
                  <span>{room.name}</span>
                  <span>{room.players.length}/2 Players</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
      <button className="back-button" onClick={() => {
        setScreen('start');
        setPlayerName('');
        if (socket) {
          socket.disconnect();
          setSocket(null);
        }
      }}>Back to Menu</button>
    </div>
  );
  
  const renderMultiplayerLobbyScreen = () => (
    <div className="multiplayer-container">
      <h1>Game Lobby</h1>
      {currentRoom && (
        <div className="lobby-container">
          <h2>{currentRoom.name}</h2>
          <div className="player-list">
            {currentRoom.players.map((player) => (
              <div key={player} className="player-item">
                <span>{player} {player === playerName ? '(You)' : ''}</span>
                <span className={`ready-status ${currentRoom.ready_players.includes(player) ? 'ready' : 'not-ready'}`}>
                  {currentRoom.ready_players.includes(player) ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            ))}
          </div>
          <button
            className={`ready-button ${isReady ? 'ready' : ''}`}
            onClick={toggleReady}
          >
            {isReady ? 'Ready!' : 'Ready?'}
          </button>
        </div>
      )}
      <button className="back-button" onClick={() => {
        setScreen('multiplayer-rooms');
        setIsReady(false);
      }}>Back to Rooms</button>
    </div>
  );
  
  const renderMultiplayerGameScreen = () => (
    <div className="game-container">
      <div className="multiplayer-game">
        <div>
          <div className="opponent-info">{opponentName}</div>
          {renderBoard(opponentBoard, false)}
          <div className="score-display">Score: {opponentScore}</div>
        </div>
        <div>
          <div className="opponent-info">{playerName} (You)</div>
          {renderBoard(board)}
          <div className="game-info">
            <h3>Next</h3>
            {renderNextPiece()}
            <div className="score-display">Score: {score}</div>
            <div className="level-display">Level: {level}</div>
            <div className="level-display">Lines: {linesCleared}</div>
          </div>
        </div>
      </div>
      {gameOver && (
        <div className="game-over">
          <div className="game-over-text">GAME OVER</div>
          <div className="final-score">Score: {score}</div>
          <button className="back-button" onClick={() => {
            setScreen('multiplayer-lobby');
            setIsReady(false);
          }}>Back to Lobby</button>
        </div>
      )}
    </div>
  );
  
  const renderSettingsScreen = () => (
    <div className="multiplayer-container">
      <div className="settings-container">
        <h1 className="settings-title">設定</h1>
        <div className="volume-control">
          <label className="volume-label">BGM Volume</label>
          <input
            type="range"
            min="0"
            max="100"
            value={bgmVolume}
            onChange={(e) => setBgmVolume(parseInt(e.target.value))}
            className="volume-slider"
          />
        </div>
        <div className="volume-control">
          <label className="volume-label">SE Volume</label>
          <input
            type="range"
            min="0"
            max="100"
            value={seVolume}
            onChange={(e) => setSeVolume(parseInt(e.target.value))}
            className="volume-slider"
          />
        </div>
        <button className="back-button" onClick={() => setScreen('start')}>Back to Menu</button>
      </div>
    </div>
  );
  
  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return renderStartScreen();
      case 'single-player':
        return renderSinglePlayerScreen();
      case 'multiplayer-rooms':
        return renderMultiplayerRoomsScreen();
      case 'multiplayer-lobby':
        return renderMultiplayerLobbyScreen();
      case 'multiplayer-game':
        return renderMultiplayerGameScreen();
      case 'settings':
        return renderSettingsScreen();
      default:
        return renderStartScreen();
    }
  };
  
  return (
    <div className="container">
      {renderScreen()}
      
      {/* Audio elements */}
      <audio ref={bgmRef} loop>
        <source src="/bgm.mp3" type="audio/mp3" />
      </audio>
      <audio ref={moveSound}>
        <source src="/move.mp3" type="audio/mp3" />
      </audio>
      <audio ref={rotateSound}>
        <source src="/rotate.mp3" type="audio/mp3" />
      </audio>
      <audio ref={dropSound}>
        <source src="/drop.mp3" type="audio/mp3" />
      </audio>
      <audio ref={clearSound}>
        <source src="/clear.mp3" type="audio/mp3" />
      </audio>
      <audio ref={gameOverSound}>
        <source src="/gameover.mp3" type="audio/mp3" />
      </audio>
    </div>
  );
}

export default App;

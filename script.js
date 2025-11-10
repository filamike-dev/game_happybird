// === 遊戲設定與變數 (全域變數) ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const startButton = document.getElementById('start-btn');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageContent = document.getElementById('message-content');
    
let animationId;
let gameRunning = false;
let initialTouchX = null;
let playerControl = 0; // -1: left, 0: stop, 1: right
let lastFireTime = 0;
const FIRE_COOLDOWN = 300; // 射擊冷卻時間 (毫秒)

// 遊戲狀態
let score = 0;
let lives = 3;
let invaderSpeed = 0.5; // 入侵者基礎速度
const INVADER_DESCENT = 10; // 每次轉向下降的像素

// 玩家設定
const player = {
    width: 30,
    height: 10,
    x: 0,
    y: 0,
    speed: 5,
    color: '#00ff00' // 綠色飛船
};

// 子彈設定
const bullet = {
    width: 3,
    height: 10,
    speed: 7,
    color: '#ff00cc' // 粉色子彈
};
let bullets = [];

// 入侵者設定
const invader = {
    rows: 5,
    cols: 10,
    width: 25,
    height: 20,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 20,
    colors: ['#00ff00', '#ff0000', '#ffff00', '#00ffff', '#ff00ff'] // 復古顏色
};
let invaders = [];
let invaderDirection = 1; // 1: right, -1: left

// === 訊息處理 (全域函數，供 HTML 中的 onclick 呼叫) ===
function showMessage(text, callback = null) {
    gameRunning = false;
    messageText.textContent = text;
    messageBox.style.display = 'flex';
    messageContent.classList.add('active');
    startButton.textContent = '重新開始';
    
    const okButton = messageContent.querySelector('.game-btn');
    okButton.onclick = () => {
        hideMessage();
        if (callback) callback();
    };
}

function hideMessage() {
    messageContent.classList.remove('active');
    messageBox.style.display = 'none';
    startButton.textContent = '開始/暫停';
}

// === 初始化與重置 ===

/** 根據容器大小調整畫布尺寸 */
function resizeCanvas() {
    const containerWidth = document.getElementById('game-container').clientWidth - 20; 
    const aspectRatio = 4 / 3; 
    
    canvas.width = containerWidth;
    canvas.height = containerWidth / aspectRatio;

    // 玩家位置初始化
    player.x = (canvas.width - player.width) / 2;
    player.y = canvas.height - player.height - 10;
    
    // 重新調整入侵者 offset，使其居中
    const totalInvadersWidth = invader.cols * invader.width + (invader.cols - 1) * invader.padding;
    invader.offsetLeft = (canvas.width - totalInvadersWidth) / 2;

    if (!gameRunning) {
        draw();
    }
}

/** 建立入侵者陣列 */
function createInvaders() {
    invaders = [];
    for (let c = 0; c < invader.cols; c++) {
        for (let r = 0; r < invader.rows; r++) {
            invaders.push({
                x: c * (invader.width + invader.padding) + invader.offsetLeft,
                y: r * (invader.height + invader.padding) + invader.offsetTop,
                status: 1, // 1: 活著, 0: 死亡
                color: invader.colors[r % invader.colors.length] 
            });
        }
    }
    invaderDirection = 1;
    invaderSpeed = 0.5;
}

/** 重置遊戲狀態 */
function resetGame() {
    score = 0;
    lives = 3;
    bullets = [];
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    createInvaders();
    resizeCanvas(); // 必須在創建入侵者後呼叫，以確定其位置
    playerControl = 0;
    gameRunning = false;
    startButton.textContent = '開始遊戲';
}

// === 繪圖函數 ===

/** 繪製背景 */
function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/** 繪製玩家飛船 (使用幾何形狀模擬) */
function drawPlayer() {
    ctx.fillStyle = player.color;
    // 底部主體
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // 頂部砲管 (位於中心)
    ctx.fillRect(player.x + player.width / 2 - 2, player.y - 5, 4, 5);
}

/** 繪製子彈 */
function drawBullets() {
    ctx.fillStyle = bullet.color;
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, bullet.width, bullet.height);
    });
}

/** 繪製入侵者 (使用像素塊模擬) */
function drawInvaders() {
    invaders.forEach(inv => {
        if (inv.status === 1) {
            ctx.fillStyle = inv.color;
            ctx.fillRect(inv.x, inv.y, invader.width, invader.height);
            
            // 模擬眼睛或細節
            ctx.fillStyle = '#000000';
            ctx.fillRect(inv.x + 5, inv.y + 5, 5, 5);
            ctx.fillRect(inv.x + invader.width - 10, inv.y + 5, 5, 5);
        }
    });
}

/** 主繪圖函數 */
function draw() {
    drawBackground();
    drawInvaders();
    drawPlayer();
    drawBullets();
}

// === 遊戲邏輯 (全域函數，供 HTML 中的 onclick 呼叫) ===

/** 玩家射擊 */
function fireBullet() {
    const now = Date.now();
    if (!gameRunning || now - lastFireTime < FIRE_COOLDOWN) return;

    bullets.push({
        x: player.x + player.width / 2 - bullet.width / 2,
        y: player.y - bullet.height,
    });
    lastFireTime = now;
}

/** 移動玩家飛船 */
function movePlayer(direction) {
    playerControl = direction;
}

/** 更新玩家狀態 */
function updatePlayer() {
    player.x += playerControl * player.speed;

    // 邊界檢查
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

/** 更新子彈狀態 */
function updateBullets() {
    bullets.forEach(b => {
        b.y -= bullet.speed;
    });

    // 移除超出螢幕的子彈
    bullets = bullets.filter(b => b.y + bullet.height > 0);
}

/** 更新入侵者狀態 */
function updateInvaders() {
    let shouldDescend = false;
    let lowestY = 0;

    // 1. 移動
    invaders.forEach(inv => {
        if (inv.status === 1) {
            inv.x += invaderSpeed * invaderDirection;
            lowestY = Math.max(lowestY, inv.y + invader.height);
        }
    });

    // 2. 邊界檢查與轉向
    const activeInvaders = invaders.filter(inv => inv.status === 1);
    if (activeInvaders.length > 0) {
        const minX = Math.min(...activeInvaders.map(inv => inv.x));
        const maxX = Math.max(...activeInvaders.map(inv => inv.x + invader.width));

        if (maxX > canvas.width - invader.padding || minX < invader.padding) {
            invaderDirection *= -1; // 改變方向
            shouldDescend = true;
        }

        // 3. 下降
        if (shouldDescend) {
            invaders.forEach(inv => {
                if (inv.status === 1) {
                    inv.y += INVADER_DESCENT;
                }
            });
            // 每次下降後，稍微增加速度
            invaderSpeed *= 1.05; 
        }
    }


    // 4. 檢查失敗條件 (入侵者到達底部)
    if (lowestY >= player.y) {
         gameOver(false); // 入侵者獲勝
    }
}

/** 碰撞檢測：子彈 vs. 入侵者 */
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        for (let j = invaders.length - 1; j >= 0; j--) {
            const inv = invaders[j];

            if (inv.status === 1) {
                const hit = b.x < inv.x + invader.width &&
                            b.x + bullet.width > inv.x &&
                            b.y < inv.y + invader.height &&
                            b.y + bullet.height > inv.y;

                if (hit) {
                    // 擊中！
                    inv.status = 0; // 銷毀入侵者
                    bullets.splice(i, 1); // 銷毀子彈
                    score += 10;
                    scoreDisplay.textContent = score;
                    
                    // 檢查是否勝利
                    if (invaders.every(inv => inv.status === 0)) {
                        gameOver(true); 
                        return; 
                    }
                    // 由於子彈被移除，跳出內層循環
                    break; 
                }
            }
        }
    }
}

/** 遊戲結束 */
function gameOver(isWin) {
    cancelAnimationFrame(animationId);
    gameRunning = false;
    if (isWin) {
        showMessage(`恭喜! 您成功擊退了所有入侵者! 最終分數: ${score}`, resetGame);
    } else {
        showMessage(`遊戲失敗! 外星人抵達地面! 您的分數是: ${score}`, resetGame);
    }
}

/** 遊戲主循環 */
function gameLoop() {
    if (!gameRunning) return;

    updatePlayer();
    updateBullets();
    updateInvaders();
    checkCollisions();

    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

/** 開始/暫停遊戲 (全域函數，供 HTML 中的 onclick 呼叫) */
function toggleGame() {
    if (lives <= 0) {
        // 如果生命耗盡，先重置遊戲
        resetGame(); 
    }

    if (gameRunning) {
        cancelAnimationFrame(animationId);
        gameRunning = false;
        startButton.textContent = '繼續遊戲';
    } else {
        gameRunning = true;
        startButton.textContent = '暫停遊戲';
        gameLoop();
    }
}

// === 事件監聽器 ===

// 鍵盤控制
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        movePlayer(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        movePlayer(-1);
    } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        fireBullet();
    } else if (e.key === 'p' || e.key === 'P') {
        toggleGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'd' || e.key === 'a') {
        movePlayer(0); 
    }
});

// 觸控控制
let touchStartX = null;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    // 首次觸碰觸發射擊
    fireBullet(); 
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (touchStartX === null) return;
    
    const currentTouchX = e.touches[0].clientX;
    const diff = currentTouchX - touchStartX;

    // 根據移動距離調整玩家位置
    player.x += diff * 1.5; 

    // 邊界檢查
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    touchStartX = currentTouchX;

    if (!gameRunning) {
        draw(); 
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    touchStartX = null;
    playerControl = 0; // 觸控結束後停止移動
});

canvas.addEventListener('click', fireBullet); // 點擊畫布射擊 (備用)

// 開始按鈕
startButton.addEventListener('click', toggleGame);

// 視窗大小改變時，重新調整畫布
window.addEventListener('resize', resizeCanvas);

// === 遊戲初始化 (在頁面完全載入後執行) ===
window.addEventListener('load', () => {
    resetGame(); // 初始化所有物件和陣列
    // resizeCanvas() 在 resetGame() 裡已經呼叫
    draw(); 
    
    showMessage("小蜜蜂入侵！\n使用左右箭頭或滑動螢幕移動。\n按空白鍵或點擊射擊按鈕來防禦！", null);
});
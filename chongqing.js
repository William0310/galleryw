document.addEventListener('DOMContentLoaded', () => {
    const tunnel = document.getElementById('tunnel');
    const items = document.querySelectorAll('.tunnel-item');
    const ambientBg = document.getElementById('ambient-bg');
    const hero = document.querySelector('.hero-fixed');
    
    // Z轴推拉的系数：数字越大，滑得越快
    const zSpeed = 1.2; 
    
    // 动画帧请求变量，用于性能优化
    let ticking = false;
    let scrollY = 0;

    function updateScene() {
        // 1. 计算当前的 Z 轴推进距离
        const cameraZ = scrollY * zSpeed;
        
        // 推着整个隧道往脸上走
        tunnel.style.transform = `translateZ(${cameraZ}px)`;

        // 2. 处理首屏标题的消失 (推进 500px 后彻底隐去)
        const heroOpacity = Math.max(1 - (cameraZ / 500), 0);
        hero.style.opacity = heroOpacity;

        // 3. 计算每张照片与摄像机的距离，做精准的光影打击
        items.forEach(item => {
            // 获取在 HTML 里写的深度 (注意是负数)
            const itemZ = parseFloat(item.style.getPropertyValue('--z'));
            
            // 计算相对摄像机的距离 (大于0说明还在前面，小于0说明已经穿过了屏幕)
            const distance = itemZ + cameraZ;

            // --- 显隐逻辑 (极其重要，优化性能) ---
            // 距离大于 2000 的太远了，完全透明。
            // 距离穿过屏幕 (-500) 时，也完全透明。
            // --- 显隐与光学景深逻辑 ---
            if (distance > 2500 || distance < -800) {
                item.style.opacity = 0;
                item.style.filter = 'blur(20px)'; // 远端彻底模糊，降低 GPU 渲染压力
                item.classList.remove('active');
            } else {
                // 1. 透明度计算 (你原有的完美逻辑)
                const opacity = Math.min(1, (2500 - distance) / 1500);
                const fadeOut = distance < 0 ? (1 + distance / 800) : 1;
                item.style.opacity = opacity * fadeOut;

                // 2. 光学景深模糊计算 (Optical Depth of Field)
                // ...
let blurValue = 0;
if (distance > 800) {
    blurValue = (distance - 800) / 150; 
} else if (distance < 0) {
    blurValue = Math.abs(distance) / 50;
}
// 🎯 性能优化核心：限制最大为 10px，并且强制取整，拒绝小数像素渲染
blurValue = Math.min(Math.round(blurValue), 8);

// 如果模糊值为 0，直接移除 filter 属性，彻底释放显卡
if (blurValue === 0) {
    item.style.filter = 'none';
} else {
    item.style.filter = `blur(${blurValue}px)`;
}
// ...
                
                

                // 3. 霓虹环境光打击逻辑 (保留你的原有代码)
                if (distance < 800 && distance > -200) {
                    item.classList.add('active'); 
                    const color = item.getAttribute('data-color');
                    ambientBg.style.boxShadow = `inset 0 0 150px ${color}`; 
                } else {
                    item.classList.remove('active');
                }
            }
        });

        ticking = false;
    }

    // 监听滚动事件，使用 requestAnimationFrame 保证 60fps 丝滑不卡顿
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        if (!ticking) {
            window.requestAnimationFrame(updateScene);
            ticking = true;
        }
    });

    // 初始渲染一次
    updateScene();
});
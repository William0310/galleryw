/**
 * transition.js - Gallery W 全局平滑过场 (自带样式注入版)
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 动态注入 CSS (解决你没有全局 CSS 的痛点)
    const style = document.createElement('style');
    style.textContent = `
        .page-transition-overlay {
            position: fixed; top: 0; left: 0; 
            width: 100vw; height: 100vh;
            background-color: #030305;
            z-index: 99990;
            pointer-events: all;
            opacity: 1;
            transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .page-transition-overlay.is-revealed {
            opacity: 0;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    // 2. 创建纯黑物理幕布
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);

    // 3. 揭幕（稍微延迟，确保 CSS 生效）
    requestAnimationFrame(() => {
        setTimeout(() => {
            overlay.classList.add('is-revealed');
        }, 50);
    });

    // 4. 拦截页面跳转
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href && !href.startsWith('http') && !href.startsWith('#') && link.target !== '_blank') {
                e.preventDefault(); 
                
                // 降下幕布
                overlay.classList.remove('is-revealed');
                
                // 等待 800ms 幕布完全黑下来，再执行真实跳转
                setTimeout(() => {
                    window.location.href = href;
                }, 600); 
            }
        });
    });

    // 5. iOS Safari 防回退黑屏
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            overlay.classList.add('is-revealed');
        }
    });
});
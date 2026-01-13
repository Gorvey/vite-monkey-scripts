(() => {
    // 配置变量
    const CONFIG_KEY = "difyChatbotConfig";
    const BUTTON_ID = "dify-chatbot-bubble-button";
    const WINDOW_ID = "dify-chatbot-bubble-window";

    // 全局变量
    const chatbotConfig = window[CONFIG_KEY];
    let isExpanded = false;
    let isDragging = false;

    // 聊天窗口的CSS样式
    const windowStyles = `
        position: absolute;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        top: unset;
        right: var(--${BUTTON_ID}-right, 1rem);
        bottom: var(--${BUTTON_ID}-bottom, 1rem);
        left: unset;
        width: 24rem;
        max-width: calc(100vw - 2rem);
        height: 43.75rem;
        max-height: calc(100vh - 6rem);
        border: none;
        z-index: 2147483640;
        overflow: hidden;
        user-select: none;
        transition-property: width, height;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
    `;

    /**
     * 初始化聊天机器人
     */
    async function initializeChatbot() {
        isDragging = false;

        if (!chatbotConfig || !chatbotConfig.token) {
            console.error(CONFIG_KEY + " is empty or token is not provided");
            return;
        }

        // 构建URL参数
        const urlParams = new URLSearchParams({
            ...await processInputs(),
            ...await processSystemVariables()
        });

        // 构建基础URL
        const baseUrl = chatbotConfig.baseUrl || `https://${chatbotConfig.isDev ? "dev." : ""}udify.app`;
        const origin = new URL(baseUrl).origin;
        const chatbotUrl = `${baseUrl}/chatbot?${urlParams}`;

        // 检查URL长度
        if (chatbotUrl.length > 2048) {
            console.error("The URL is too long, please reduce the number of inputs to prevent the bot from failing to load");
        }

        /**
         * 处理输入参数
         */
        async function processInputs() {
            const inputs = chatbotConfig?.inputs || {};
            const processedInputs = {};

            await Promise.all(Object.entries(inputs).map(async ([key, value]) => {
                processedInputs[key] = await compressData(value);
            }));

            return processedInputs;
        }

        /**
         * 处理系统变量
         */
        async function processSystemVariables() {
            const systemVariables = chatbotConfig?.systemVariables || {};
            const processedVariables = {};

            await Promise.all(Object.entries(systemVariables).map(async ([key, value]) => {
                processedVariables["sys." + key] = await compressData(value);
            }));

            return processedVariables;
        }

        /**
         * 压缩数据
         */
        async function compressData(data) {
            const encodedData = new TextEncoder().encode(data);
            const compressedStream = new Response(
                new Blob([encodedData]).stream().pipeThrough(new CompressionStream("gzip"))
            ).arrayBuffer();
            const compressedArray = new Uint8Array(await compressedStream);
            return btoa(String.fromCharCode(...compressedArray));
        }

        /**
         * 创建聊天窗口iframe
         */
        function createChatWindow() {
            const iframe = document.createElement("iframe");
            iframe.allow = "fullscreen;microphone";
            iframe.title = "dify chatbot bubble window";
            iframe.id = WINDOW_ID;
            iframe.src = chatbotUrl;
            iframe.style.cssText = windowStyles;
            return iframe;
        }

        /**
         * 调整窗口位置
         */
        function adjustWindowPosition() {
            if (window.innerWidth <= 640) return;

            const chatWindow = document.getElementById(WINDOW_ID);
            const button = document.getElementById(BUTTON_ID);

            if (!chatWindow || !button) return;

            const buttonRect = button.getBoundingClientRect();
            const windowCenter = window.innerHeight / 2;

            // 垂直位置调整
            if (buttonRect.top + buttonRect.height / 2 < windowCenter) {
                chatWindow.style.top = `var(--${BUTTON_ID}-bottom, 1rem)`;
                chatWindow.style.bottom = "unset";
            } else {
                chatWindow.style.bottom = `var(--${BUTTON_ID}-bottom, 1rem)`;
                chatWindow.style.top = "unset";
            }

            // 水平位置调整
            if (buttonRect.left + buttonRect.width / 2 < window.innerWidth / 2) {
                chatWindow.style.left = `var(--${BUTTON_ID}-right, 1rem)`;
                chatWindow.style.right = "unset";
            } else {
                chatWindow.style.right = `var(--${BUTTON_ID}-right, 1rem)`;
                chatWindow.style.left = "unset";
            }
        }

        /**
         * 创建气泡按钮
         */
        function createBubbleButton() {
            // 创建按钮容器
            const buttonContainer = document.createElement("div");

            // 应用容器属性
            Object.entries(chatbotConfig.containerProps || {}).forEach(([key, value]) => {
                if (key === "className") {
                    buttonContainer.classList.add(...value.split(" "));
                } else if (key === "style") {
                    if (typeof value === "object") {
                        Object.assign(buttonContainer.style, value);
                    } else {
                        buttonContainer.style.cssText = value;
                    }
                } else if (typeof value === "function") {
                    buttonContainer.addEventListener(
                        key.replace(/^on/, "").toLowerCase(),
                        value
                    );
                } else {
                    buttonContainer[key] = value;
                }
            });

            buttonContainer.id = BUTTON_ID;

            // 添加按钮样式
            const style = document.createElement("style");
            document.head.appendChild(style);
            style.sheet.insertRule(`
                #${buttonContainer.id} {
                    position: fixed;
                    bottom: var(--${buttonContainer.id}-bottom, 1rem);
                    right: var(--${buttonContainer.id}-right, 1rem);
                    left: var(--${buttonContainer.id}-left, unset);
                    top: var(--${buttonContainer.id}-top, unset);
                    width: var(--${buttonContainer.id}-width, 48px);
                    height: var(--${buttonContainer.id}-height, 48px);
                    border-radius: var(--${buttonContainer.id}-border-radius, 25px);
                    background-color: var(--${buttonContainer.id}-bg-color, #155EEF);
                    box-shadow: var(--${buttonContainer.id}-box-shadow, rgba(0, 0, 0, 0.2) 0px 4px 8px 0px);
                    cursor: pointer;
                    z-index: 2147483647;
                }
            `);

            // 创建按钮图标容器
            const iconContainer = document.createElement("div");
            iconContainer.style.cssText = `
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                z-index: 2147483647;
            `;

            // 添加图标
            iconContainer.innerHTML = `
                <svg id="openIcon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.7586 2L16.2412 2C17.0462 1.99999 17.7105 1.99998 18.2517 2.04419C18.8138 2.09012 19.3305 2.18868 19.8159 2.43598C20.5685 2.81947 21.1804 3.43139 21.5639 4.18404C21.8112 4.66937 21.9098 5.18608 21.9557 5.74818C21.9999 6.28937 21.9999 6.95373 21.9999 7.7587L22 14.1376C22.0004 14.933 22.0007 15.5236 21.8636 16.0353C21.4937 17.4156 20.4155 18.4938 19.0352 18.8637C18.7277 18.9461 18.3917 18.9789 17.9999 18.9918L17.9999 20.371C18 20.6062 18 20.846 17.9822 21.0425C17.9651 21.2305 17.9199 21.5852 17.6722 21.8955C17.3872 22.2525 16.9551 22.4602 16.4983 22.4597C16.1013 22.4593 15.7961 22.273 15.6386 22.1689C15.474 22.06 15.2868 21.9102 15.1031 21.7632L12.69 19.8327C12.1714 19.4178 12.0174 19.3007 11.8575 19.219C11.697 19.137 11.5262 19.0771 11.3496 19.0408C11.1737 19.0047 10.9803 19 10.3162 19H7.75858C6.95362 19 6.28927 19 5.74808 18.9558C5.18598 18.9099 4.66928 18.8113 4.18394 18.564C3.43129 18.1805 2.81937 17.5686 2.43588 16.816C2.18859 16.3306 2.09002 15.8139 2.0441 15.2518C1.99988 14.7106 1.99989 14.0463 1.9999 13.2413V7.75868C1.99989 6.95372 1.99988 6.28936 2.0441 5.74818C2.09002 5.18608 2.18859 4.66937 2.43588 4.18404C2.81937 3.43139 3.43129 2.81947 4.18394 2.43598C4.66928 2.18868 5.18598 2.09012 5.74808 2.04419C6.28927 1.99998 6.95364 1.99999 7.7586 2ZM10.5073 7.5C10.5073 6.67157 9.83575 6 9.00732 6C8.1789 6 7.50732 6.67157 7.50732 7.5C7.50732 8.32843 8.1789 9 9.00732 9C9.83575 9 10.5073 8.32843 10.5073 7.5ZM16.6073 11.7001C16.1669 11.3697 15.5426 11.4577 15.2105 11.8959C15.1488 11.9746 15.081 12.0486 15.0119 12.1207C14.8646 12.2744 14.6432 12.4829 14.3566 12.6913C13.7796 13.111 12.9818 13.5001 12.0073 13.5001C11.0328 13.5001 10.235 13.111 9.65799 12.6913C9.37138 12.4829 9.15004 12.2744 9.00274 12.1207C8.93366 12.0486 8.86581 11.9745 8.80418 11.8959C8.472 11.4577 7.84775 11.3697 7.40732 11.7001C6.96549 12.0314 6.87595 12.6582 7.20732 13.1001C7.20479 13.0968 7.21072 13.1043 7.22094 13.1171C7.24532 13.1478 7.29407 13.2091 7.31068 13.2289C7.36932 13.2987 7.45232 13.3934 7.55877 13.5045C7.77084 13.7258 8.08075 14.0172 8.48165 14.3088C9.27958 14.8891 10.4818 15.5001 12.0073 15.5001C13.5328 15.5001 14.735 14.8891 15.533 14.3088C15.9339 14.0172 16.2438 13.7258 16.4559 13.5045C16.5623 13.3934 16.6453 13.2987 16.704 13.2289C16.7333 13.1939 16.7567 13.165 16.7739 13.1432C17.1193 12.6969 17.0729 12.0493 16.6073 11.7001ZM15.0073 6C15.8358 6 16.5073 6.67157 16.5073 7.5C16.5073 8.32843 15.8358 9 15.0073 9C14.1789 9 13.5073 8.32843 13.5073 7.5C13.5073 6.67157 14.1789 6 15.0073 6Z" fill="white"/>
                </svg>
                <svg id="closeIcon" style="display:none" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 18L6 6M6 18L18 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;

            buttonContainer.appendChild(iconContainer);
            document.body.appendChild(buttonContainer);

            /**
             * 切换聊天窗口显示状态
             */
            function toggleChatWindow() {
                if (isDragging) return;

                const chatWindow = document.getElementById(WINDOW_ID);

                if (chatWindow) {
                    // 切换显示状态
                    const isVisible = chatWindow.style.display !== "none";
                    chatWindow.style.display = isVisible ? "none" : "block";

                    // 更新图标状态
                    toggleIcon(isVisible ? "open" : "close");

                    // 处理键盘事件监听
                    if (isVisible) {
                        document.removeEventListener("keydown", handleEscapeKey);
                    } else {
                        document.addEventListener("keydown", handleEscapeKey);
                    }

                    adjustWindowPosition();
                } else {
                    // 创建新的聊天窗口
                    buttonContainer.appendChild(createChatWindow());
                    adjustWindowPosition();
                    this.title = "Exit (ESC)";
                    toggleIcon("close");
                    document.addEventListener("keydown", handleEscapeKey);
                }
            }

            // 绑定点击事件
            buttonContainer.addEventListener("click", toggleChatWindow);
            buttonContainer.addEventListener("touchend", (event) => {
                event.preventDefault();
                toggleChatWindow();
            }, { passive: false });

            // 添加拖拽功能
            if (chatbotConfig.draggable) {
                setupDragFunctionality(buttonContainer);
            }
        }

        /**
         * 设置拖拽功能
         */
        function setupDragFunctionality(element) {
            const dragAxis = chatbotConfig.dragAxis || "both";
            let startX, startY, initialClientX, initialClientY;

            function handleDragStart(event) {
                isDragging = false;

                if (event.type === "touchstart") {
                    startX = event.touches[0].clientX - element.offsetLeft;
                    startY = event.touches[0].clientY - element.offsetTop;
                    initialClientX = event.touches[0].clientX;
                    initialClientY = event.touches[0].clientY;
                } else {
                    startX = event.clientX - element.offsetLeft;
                    startY = event.clientY - element.offsetTop;
                    initialClientX = event.clientX;
                    initialClientY = event.clientY;
                }

                document.addEventListener("mousemove", handleDragMove);
                document.addEventListener("touchmove", handleDragMove, { passive: false });
                document.addEventListener("mouseup", handleDragEnd);
                document.addEventListener("touchend", handleDragEnd);

                event.preventDefault();
            }

            function handleDragMove(event) {
                const clientX = event.type === "touchmove" ? event.touches[0].clientX : event.clientX;
                const clientY = event.type === "touchmove" ? event.touches[0].clientY : event.clientY;

                const deltaX = clientX - initialClientX;
                const deltaY = clientY - initialClientY;

                // 检测是否开始拖拽
                if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
                    isDragging = true;
                }

                if (isDragging) {
                    element.style.transition = "none";
                    element.style.cursor = "grabbing";

                    // 隐藏聊天窗口
                    const chatWindow = document.getElementById(WINDOW_ID);
                    if (chatWindow) {
                        chatWindow.style.display = "none";
                        toggleIcon("open");
                    }

                    // 计算新位置
                    const newLeft = clientX - startX;
                    const newBottom = window.innerHeight - clientY - startY;

                    const rect = element.getBoundingClientRect();
                    const maxLeft = window.innerWidth - rect.width;
                    const maxBottom = window.innerHeight - rect.height;

                    // 应用位置限制
                    if (dragAxis === "both" || dragAxis === "x") {
                        element.style.setProperty(`--${BUTTON_ID}-left`, Math.max(0, Math.min(newLeft, maxLeft)) + "px");
                    }

                    if (dragAxis === "both" || dragAxis === "y") {
                        element.style.setProperty(`--${BUTTON_ID}-bottom`, Math.max(0, Math.min(newBottom, maxBottom)) + "px");
                    }
                }
            }

            function handleDragEnd() {
                setTimeout(() => {
                    isDragging = false;
                }, 0);

                element.style.transition = "";
                element.style.cursor = "pointer";

                document.removeEventListener("mousemove", handleDragMove);
                document.removeEventListener("touchmove", handleDragMove);
                document.removeEventListener("mouseup", handleDragEnd);
                document.removeEventListener("touchend", handleDragEnd);
            }

            element.addEventListener("mousedown", handleDragStart);
            element.addEventListener("touchstart", handleDragStart);
        }

        // 处理消息通信
        window.addEventListener("message", (event) => {
            if (event.origin !== origin) return;

            const chatWindow = document.getElementById(WINDOW_ID);
            if (!chatWindow || event.source !== chatWindow.contentWindow) return;

            if (event.data.type === "dify-chatbot-iframe-ready") {
                chatWindow.contentWindow?.postMessage({
                    type: "dify-chatbot-config",
                    payload: {
                        isToggledByButton: true,
                        isDraggable: !!chatbotConfig.draggable
                    }
                }, origin);
            }

            if (event.data.type === "dify-chatbot-expand-change") {
                isExpanded = !isExpanded;
                const window = document.getElementById(WINDOW_ID);

                if (window) {
                    if (isExpanded) {
                        // 展开状态的样式
                        window.style.cssText = `
                            position: absolute;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            top: unset;
                            right: var(--dify-chatbot-bubble-button-right, 1rem);
                            bottom: var(--dify-chatbot-bubble-button-bottom, 1rem);
                            left: unset;
                            min-width: 24rem;
                            width: 48%;
                            max-width: 40rem;
                            min-height: 43.75rem;
                            height: 88%;
                            max-height: calc(100vh - 6rem);
                            border: none;
                            z-index: 2147483640;
                            overflow: hidden;
                            user-select: none;
                            transition-property: width, height;
                            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                            transition-duration: 150ms;
                        `;
                    } else {
                        // 正常状态的样式
                        window.style.cssText = windowStyles;
                    }
                    adjustWindowPosition();
                }
            }
        });

        // 如果按钮不存在则创建
        if (!document.getElementById(BUTTON_ID)) {
            createBubbleButton();
        }
    }

    /**
     * 切换图标显示状态
     */
    function toggleIcon(state = "open") {
        const openIcon = document.getElementById("openIcon");
        const closeIcon = document.getElementById("closeIcon");

        if (state === "open") {
            if (openIcon) openIcon.style.display = "block";
            if (closeIcon) closeIcon.style.display = "none";
        } else {
            if (openIcon) openIcon.style.display = "none";
            if (closeIcon) closeIcon.style.display = "block";
        }
    }

    /**
     * 处理ESC键关闭窗口
     */
    function handleEscapeKey(event) {
        if (event.key === "Escape") {
            const chatWindow = document.getElementById(WINDOW_ID);
            if (chatWindow && chatWindow.style.display !== "none") {
                chatWindow.style.display = "none";
                toggleIcon("open");
            }
        }
    }

    // 添加全局ESC键监听
    document.addEventListener("keydown", handleEscapeKey);

    // 初始化聊天机器人
    if (chatbotConfig?.dynamicScript) {
        initializeChatbot();
    } else {
        document.body.onload = initializeChatbot;
    }
})(); 
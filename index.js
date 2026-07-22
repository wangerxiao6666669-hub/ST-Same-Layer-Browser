// 导出可供全局调用的打开/关闭方法
window.openXinnetBrowser = function() {
    $('#xinnet-browser-overlay').removeClass('xinnet-hidden');
};

window.closeXinnetBrowser = function() {
    $('#xinnet-browser-overlay').addClass('xinnet-hidden');
};

// 注册 SillyTavern 的斜杠命令 (Slash Command)
// 这样你可以在酒馆的快速回复 (Quick Replies) 里直接写 /phone 就能打开！
function registerSlashCommands() {
    if (window.SlashCommandParser && typeof window.SlashCommandParser.addCommandObject === 'function') {
        window.SlashCommandParser.addCommandObject({
            name: 'phone',
            callback: () => {
                window.openXinnetBrowser();
                return '';
            },
            help: '打开 XINNET 拟真同层浏览器',
        });
    }
}

// 在初始化函数中调用注册
jQuery(async () => {
    await loadTemplate();
    bindEvents();
    registerSlashCommands(); // 注册 /phone 命令
});

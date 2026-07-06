document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const taskCount = document.getElementById('task-count');
    const aiSortBtn = document.getElementById('ai-sort-btn');
    const focusArea = document.getElementById('focus-area');
    const primaryTaskDisplay = document.getElementById('primary-task');
    const completePrimaryBtn = document.getElementById('complete-primary-btn');
    const celebrationToast = document.getElementById('celebration-toast');

    // State
    let tasks = [];

    // Initialize
    updateUI();

    // Event Listeners
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = taskInput.value.trim();
        if (content) {
            addTask(content);
            taskInput.value = '';
        }
    });

    // Quick add tags
    document.querySelectorAll('.quick-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            const content = e.target.textContent;
            addTask(content);
        });
    });

    aiSortBtn.addEventListener('click', organizeWithAI);

    completePrimaryBtn.addEventListener('click', () => {
        if (tasks.length > 0) {
            // Remove the top task (which is the primary one after sorting)
            tasks.shift();
            focusArea.classList.add('hidden');
            updateUI();
            showCelebration();
        }
    });

    // Functions
    function showCelebration() {
        celebrationToast.classList.add('show');
        setTimeout(() => {
            celebrationToast.classList.remove('show');
        }, 3000);
    }

    function parseTask(rawContent) {
        let summary = rawContent;
        let deadline = '';
        let estimatedTime = '';
        let advice = '';
        
        // 簡単な期限キーワードの抽出モック
        const timeKeywords = ["今日中", "今日", "明日まで", "明日", "今週中", "来週", "至急"];
        for (const kw of timeKeywords) {
            if (summary.includes(kw)) {
                deadline = kw;
                // キーワード部分などを削除して要約
                summary = summary.replace(kw, '').replace(/に|までに/g, '').trim();
                break;
            }
        }
        
        // 2. 所要時間の見積もり
        if (/電話|連絡|メール|返信|確認|ちょっと/.test(rawContent)) {
            estimatedTime = '約5分';
        } else if (/調べる|検索|読む|チェック/.test(rawContent)) {
            estimatedTime = '約15分';
        } else if (/作成|企画|まとめる|レポート|資料/.test(rawContent)) {
            estimatedTime = '約30分〜';
        }

        // 3. 抽象的タスクへのアドバイス
        if (summary.length < 4 && /考える|企画|やる|する/.test(rawContent)) {
            advice = '💡 少し大きすぎるかも？「まずは10分だけ参考資料を探す」など、最初の1歩に分解してみましょう。';
        } else if (/検討|準備/.test(rawContent)) {
            advice = '💡 具体的に「誰に」「何を」するか書き出すと、もっと動きやすくなりますよ。';
        }

        // 長い場合は「要約」として切り詰める
        if (summary.length > 15) {
            summary = summary.substring(0, 15) + '...';
        }
        if (!summary) summary = "タスク";

        return { summary, deadline, estimatedTime, advice };
    }

    function addTask(content) {
        const { summary, deadline, estimatedTime, advice } = parseTask(content);
        const newTask = {
            id: Date.now().toString(),
            rawContent: content, // AI判定用
            summary: summary,    // UI表示用
            deadline: deadline,  // UI表示用
            estimatedTime: estimatedTime,
            advice: advice,
            createdAt: new Date()
        };
        tasks.push(newTask);
        updateUI();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        updateUI();
        
        // If focus area was showing the deleted task, hide it
        if (tasks.length === 0) {
            focusArea.classList.add('hidden');
        }
    }

    function updateUI() {
        // Update Count
        taskCount.textContent = tasks.length;

        // Enable/Disable AI button
        aiSortBtn.disabled = tasks.length < 2;
        if(tasks.length >= 2) {
            aiSortBtn.classList.add('highlight-anim');
        } else {
            aiSortBtn.classList.remove('highlight-anim');
        }

        // Render List
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            
            let badgesHtml = '';
            if (task.deadline) {
                badgesHtml += `<span class="deadline-badge">⏰ ${escapeHTML(task.deadline)}</span>`;
            }
            if (task.estimatedTime) {
                badgesHtml += `<span class="time-badge">⏱️ ${escapeHTML(task.estimatedTime)}</span>`;
            }
            
            let adviceHtml = '';
            if (task.advice) {
                adviceHtml = `<div class="advice-text">${escapeHTML(task.advice)}</div>`;
            }

            li.innerHTML = `
                <div class="task-content">
                    <div class="task-summary">${escapeHTML(task.summary)}</div>
                    ${badgesHtml ? `<div class="badges-container">${badgesHtml}</div>` : ''}
                    ${adviceHtml}
                </div>
                <button class="delete-btn" data-id="${task.id}" aria-label="削除">×</button>
            `;
            taskList.appendChild(li);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                // Optional: add fade-out animation before deleting
                e.target.parentElement.classList.add('fade-out');
                setTimeout(() => deleteTask(id), 300);
            });
        });
    }

    // AI Mock Sorting Logic
    function organizeWithAI() {
        // Disable button during "thinking"
        const originalText = aiSortBtn.innerHTML;
        aiSortBtn.innerHTML = '<span class="magic-icon">🪄</span> AIが考え中...';
        aiSortBtn.disabled = true;
        aiSortBtn.classList.remove('highlight-anim');

        // Simulate network delay
        setTimeout(() => {
            // 優先度スコアを計算するモック機能
            tasks.forEach(task => {
                let score = 0;
                const text = task.rawContent;

                // 1. 緊急度キーワード
                if (/至急|すぐ|今日|本日|締切|期限/.test(text)) score += 100;
                if (/明日|連絡|電話|メール/.test(text)) score += 50;

                // 2. 心理的ハードルの低さ（短いタスクは「すぐ終わる」として優先）
                if (text.length < 10) score += 20;

                // 3. 曖昧なタスクは後回し（「調べる」「考える」系）
                if (/調べる|考える|検討|いつか/.test(text)) score -= 30;

                task.aiScore = score;
            });

            // スコアが高い順にソート（同点なら古いものを優先）
            tasks.sort((a, b) => {
                if (b.aiScore !== a.aiScore) {
                    return b.aiScore - a.aiScore;
                }
                return a.createdAt - b.createdAt;
            });

            // 1番優先すべきタスクを抽出して表示
            if (tasks.length > 0) {
                const primary = tasks[0];
                let primaryHtml = `<div>${escapeHTML(primary.summary)}</div>`;
                
                let badgesHtml = '';
                if(primary.deadline) {
                    badgesHtml += `<span class="deadline-badge primary-badge">⏰ ${escapeHTML(primary.deadline)}</span>`;
                }
                if(primary.estimatedTime) {
                    badgesHtml += `<span class="time-badge primary-badge">⏱️ ${escapeHTML(primary.estimatedTime)}</span>`;
                }
                if (badgesHtml) {
                    primaryHtml += `<div class="badges-container" style="justify-content: center;">${badgesHtml}</div>`;
                }
                
                if(primary.advice) {
                    primaryHtml += `<div class="advice-text" style="text-align: left;">${escapeHTML(primary.advice)}</div>`;
                }
                
                primaryTaskDisplay.innerHTML = primaryHtml;
                focusArea.classList.remove('hidden');
                
                // リストも更新
                updateUI();
                
                // リストの一番上を少しハイライト
                const firstItem = taskList.firstElementChild;
                if(firstItem) {
                    firstItem.style.border = "2px solid var(--primary-color)";
                    firstItem.style.boxShadow = "0 0 15px rgba(108, 92, 231, 0.2)";
                }
            }

            // Restore button
            aiSortBtn.innerHTML = '<span class="magic-icon">✨</span> 整理完了！';
            setTimeout(() => {
                aiSortBtn.innerHTML = originalText;
                aiSortBtn.disabled = tasks.length < 2;
            }, 2000);

        }, 800); // 800msのフェイクディレイ
    }

    // Utility
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }
});

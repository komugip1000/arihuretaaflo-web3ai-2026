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
        }
    });

    // Functions
    function addTask(content) {
        const newTask = {
            id: Date.now().toString(),
            content: content,
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
            li.innerHTML = `
                <span class="task-content">${escapeHTML(task.content)}</span>
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
                const text = task.content;

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
                primaryTaskDisplay.textContent = primary.content;
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

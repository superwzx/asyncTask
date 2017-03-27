

let scheduler,
    taskQueue = [],
    taskQueueLength = 0,
    nextHandle = 1,
    nextIndexToProcess = 0;

if (window['MutationObserver']) {
    scheduler = (callback => {
        let div = document.createElement("div");
        new MutationObserver(callback).observe(div, {attributes: true});
        return function () { div.classList.toggle("foo"); };
    })(scheduledProcess);

} else if (document && "onreadystatechange" in document.createElement("script")) {
    scheduler = callback => {
        let script = document.createElement("script");
        script.onreadystatechange = () => {
            script.onreadystatechange = null;
            document.documentElement.removeChild(script);
            script = null;
            callback();
        };
        document.documentElement.appendChild(script);
    };

} else {
    scheduler = callback => {
        setTimeout(callback, 0);
    };
}

function processTasks() {
    if (taskQueueLength) {
        let mark = taskQueueLength,
            countMarks = 0;

        for (let task; nextIndexToProcess < taskQueueLength; ) {
            if (task = taskQueue[nextIndexToProcess++]) {
                if (nextIndexToProcess > mark) {
                    if (++countMarks >= 5000) {
                        nextIndexToProcess = taskQueueLength;
                        throw new Error("'Too much recursion' after processing " + countMarks + " task groups.");
                        break;
                    }
                    mark = taskQueueLength;
                }
                try {
                    task();
                } catch (ex) {
                    throw new Error(ex);
                }
            }
        }
    }
}

function scheduledProcess() {
    processTasks();
    nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
}

function scheduleTaskProcessing() {
    tasks['scheduler'](scheduledProcess);
}

const tasks = {
    'scheduler': scheduler,

    schedule (func) {
        if (!taskQueueLength) {
            scheduleTaskProcessing();
        }
        taskQueue[taskQueueLength++] = func;
        return nextHandle++;
    },

    cancel (handle) {
        let index = handle - (nextHandle - taskQueueLength);
        if (index >= nextIndexToProcess && index < taskQueueLength) {
            taskQueue[index] = null;
        }
    },

    resetForTesting () {
        let length = taskQueueLength - nextIndexToProcess;
        nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
        return length;
    },

    runEarly: processTasks
};

export default tasks;


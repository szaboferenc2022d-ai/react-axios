import { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import axios from "axios";

import Todo from "./components/Todo";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function App(props) {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks");

    return savedTasks
      ? JSON.parse(savedTasks)
      : props.tasks ?? [];
  });

  const [filter, setFilter] = useState("All");
  const [serverStatus, setServerStatus] = useState("ellenőrzés alatt");

  // A feladatok automatikus mentése localStorage-ba
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Szerver állapotának ellenőrzése Axios-szal
  useEffect(() => {
    const controller = new AbortController();

    async function checkServer() {
      try {
        await axios.get("/", {
          signal: controller.signal,
        });

        setServerStatus("online");
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        setServerStatus("offline");
      }
    }

    checkServer();

    return () => {
      controller.abort();
    };
  }, []);

  const FILTER_MAP = {
    All: () => true,
    Active: (task) => !task.completed,
    Completed: (task) => task.completed,
  };

  const FILTER_NAMES = Object.keys(FILTER_MAP);

  const filterList = FILTER_NAMES.map((name) => (
    <FilterButton
      key={name}
      name={name}
      isPressed={name === filter}
      setFilter={setFilter}
    />
  ));

  function addTask(name) {
    const trimmedName = name.trim();

    if (trimmedName === "") {
      alert("Task name cannot be empty!");
      return;
    }

    if (trimmedName.toLowerCase() === "react") {
      alert("You can't add 'React' as a task!");
      return;
    }

    const newTask = {
      id: `todo-${nanoid()}`,
      name: trimmedName,
      completed: false,
      priority: 1,
    };

    setTasks((previousTasks) => [...previousTasks, newTask]);
  }

  function toggleTaskCompleted(id) {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function deleteTask(id) {
    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== id)
    );
  }

  function updateTaskPriority(id, priority) {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === id
          ? { ...task, priority }
          : task
      )
    );
  }

  function editTask(id, newName) {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === id
          ? { ...task, name: newName }
          : task
      )
    );
  }

  const taskList = [...tasks]
    .filter(FILTER_MAP[filter])
    .sort(
      (taskA, taskB) =>
        (taskB.priority ?? 1) - (taskA.priority ?? 1)
    )
    .map((task) => (
      <Todo
        id={task.id}
        name={task.name}
        completed={task.completed}
        priority={task.priority ?? 1}
        key={task.id}
        toggleTaskCompleted={toggleTaskCompleted}
        deleteTask={deleteTask}
        editTask={editTask}
        updateTaskPriority={updateTaskPriority}
      />
    ));

  const tasksNoun = taskList.length !== 1 ? "tasks" : "task";
  const headingText = `${taskList.length} ${tasksNoun} remaining`;

  const listHeadingRef = useRef(null);
  const prevTaskLength = usePrevious(tasks.length);

  useEffect(() => {
    if (
      prevTaskLength !== undefined &&
      tasks.length < prevTaskLength
    ) {
      listHeadingRef.current?.focus();
    }
  }, [tasks.length, prevTaskLength]);

  return (
    <div className="todoapp stack-large">
      <h1>TodoMatic</h1>

      <div style={{ textAlign: "center", margin: "auto" }}>
        <p
          style={{
            backgroundColor:
              serverStatus === "online" ? "green" : "red",
            color: "white",
            padding: "5px",
            borderRadius: "5px",
            display: "inline-block",
          }}
        >
          Szerver állapota: {serverStatus}
        </p>
      </div>

      <Form addTask={addTask} />

      <div className="filters btn-group stack-exception">
        {filterList}
      </div>

      <h2
        id="list-heading"
        tabIndex={-1}
        ref={listHeadingRef}
      >
        {headingText}
      </h2>

      <ul
        role="list"
        className="todo-list stack-large stack-exception"
        aria-labelledby="list-heading"
      >
        {taskList}
      </ul>
    </div>
  );
}

export default App;
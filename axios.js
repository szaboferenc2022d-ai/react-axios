import { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import Todo from "./components/Todo";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import axios from "axios";
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
function App(props) {
  const [tasks, setTasks] = useState(() => {
  const savedTasks = localStorage.getItem("tasks");
  return savedTasks ? JSON.parse(savedTasks) : props.tasks ?? [];
  });
  const [filter, setFilter] = useState("All");
  const [serverStatus, setServerStatus] = useState("ellenőrzés alatt");
  useEffect(() => {
    const controller = new AbortController();
    axios
      .get("/", { signal: controller.signal })
      .then(() => setServerStatus("online"))
      .catch((error) => {
        if (!axios.isCancel(error)) {
          setServerStatus("offline");
        }
      });
    return () => controller.abort();
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
  function SaveTasksToLocalStorage(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }
  function addTask(name) {
    if(name.trim().toLowerCase() === "react") {
      alert("You can't add 'React' as a task!");
      return;
    }
    if(name.trim() === "") {
      alert("Task name cannot be empty!");
      return;
    }
    const newTask = { id: `todo-${nanoid()}`, name, completed: false, priority: 1 };
    setTasks([...tasks, newTask]);
    SaveTasksToLocalStorage([...tasks, newTask]);
  }
  function toggleTaskCompleted(id) {
    const updatedTasks = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        // use object spread to make a new object
        // whose `completed` prop has been inverted
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updatedTasks);
    SaveTasksToLocalStorage(updatedTasks);
  }
  function deleteTask(id) {
    const remainingTasks = tasks.filter((task) => id !== task.id);
    setTasks(remainingTasks);
    SaveTasksToLocalStorage(remainingTasks);
  }
  function updateTaskPriority(id, priority) {
    const updatedTasks = tasks.map((task) =>
      id === task.id ? { ...task, priority } : task
    );
    setTasks(updatedTasks);
    SaveTasksToLocalStorage(updatedTasks);
  }
  const taskList = [...tasks]
  .filter(FILTER_MAP[filter])
  .sort((taskA, taskB) => (taskB.priority ?? 1) - (taskA.priority ?? 1))
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
  function editTask(id, newName) {
    const editedTaskList = tasks.map((task) => {
      if(id === task.id) {
        return {...task, name: newName}
      }
      return task;
    });
    setTasks(editedTaskList);
    SaveTasksToLocalStorage(editedTaskList);
  }
  const tasksNoun = taskList.length !== 1 ? "tasks" : "task";
  const headingText = `${taskList.length} ${tasksNoun} remaining`;
  const listHeadingRef = useRef(null);
  const prevTaskLength = usePrevious(tasks.length);
  useEffect(() => {
    if (tasks.length < prevTaskLength) {
      listHeadingRef.current.focus();
    }
  }, [tasks.length, prevTaskLength]);
  return (
    <div className="todoapp stack-large">
      <h1>TodoMatic</h1>
      <div style={{ textAlign: "center", margin: "auto"}}>
      <p
      style={
      { 
        backgroundColor: serverStatus === "online" ? "green" : "red",
        color: "white",
        padding: "5px",
        borderRadius: "5px",
        display: "inline-block"
      }
      }
      >Szerver állapota: {serverStatus}</p>
      </div>
      <Form addTask={addTask} />
      <div className="filters btn-group stack-exception">{filterList}</div>
      <h2 id="list-heading" tabIndex={-1} ref={listHeadingRef}>{headingText}</h2>
      <ul
        role="list"
        className="todo-list stack-large stack-exception"
        aria-labelledby="list-heading">
        {taskList}
      </ul>
    </div>
  );
}
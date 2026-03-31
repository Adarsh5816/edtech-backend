import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("");

  const BASE = "https://edtech-backend-r5yc.onrender.com";

  const getToken = () => localStorage.getItem("token");

  // LOGIN
  const login = async () => {
    const res = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    localStorage.setItem("token", data.token);
    setIsLoggedIn(true);
  };

  // LOAD DATA
  const loadDashboard = async () => {
    const res = await fetch(`${BASE}/dashboard`, {
      headers: { Authorization: getToken() }
    });
    const data = await res.json();
    setRole(data.role);
  };

  const loadSessions = async () => {
    const res = await fetch(`${BASE}/sessions`, {
      headers: { Authorization: getToken() }
    });
    setSessions(await res.json());
  };

  const loadUsers = async () => {
    const res = await fetch(`${BASE}/all-users`, {
      headers: { Authorization: getToken() }
    });
    setUsers(await res.json());
  };

  // RESCHEDULE
  const updateSession = async (id) => {
    await fetch(`${BASE}/session/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: getToken()
      },
      body: JSON.stringify({ date, time })
    });

    alert("Updated");
    loadSessions();
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
      loadSessions();
      loadUsers();
    }
  }, [isLoggedIn]);

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  return (
    <div className="p-6">

      {!isLoggedIn ? (
        <>
          <h2>Login</h2>
          <input placeholder="username" onChange={e=>setUsername(e.target.value)} />
          <input placeholder="password" onChange={e=>setPassword(e.target.value)} />
          <button onClick={login}>Login</button>
        </>
      ) : (
        <>
          <h2>{role}</h2>

          {/* ADMIN */}
          {role === "admin" && (
            <>
              <h3>Users</h3>
              {users.map((u,i)=>(
                <div key={i}>{u.username} - {u.role}</div>
              ))}
            </>
          )}

          {/* TUTOR WEEK VIEW */}
          {role === "tutor" && (
            <>
              {days.map(day => (
                <div key={day} className="bg-white p-4 rounded shadow mb-4">
                  <h3 className="text-green-600 text-xl">{day}</h3>

                  {sessions
                    .filter(s => new Date(s.date).toLocaleString("en-US",{weekday:"long"}) === day)
                    .map(s => (
                      <div key={s._id} className="flex gap-4 mt-2">
                        <span>{s.time}</span>
                        <a href={s.meetLink}>Meet</a>
                        <span>{s.student}</span>

                        <input type="time" onChange={e=>setTime(e.target.value)} />
                        <button onClick={()=>updateSession(s._id)}>Reschedule</button>
                      </div>
                    ))}
                </div>
              ))}
            </>
          )}

          {/* STUDENT */}
          {role === "student" && (
            <>
              <Calendar onChange={setDate} value={date} />
              {sessions.map(s => (
                <div key={s._id}>
                  {s.title} - {s.time}
                  <a href={s.meetLink}>Join</a>
                </div>
              ))}
            </>
          )}

          <button onClick={()=>{
            localStorage.removeItem("token");
            setIsLoggedIn(false);
          }}>Logout</button>
        </>
      )}
    </div>
  );
}

export default App;
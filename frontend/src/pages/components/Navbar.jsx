import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import heximus from "../../assets/heximus.png";
import { Link } from "react-router-dom";
import "./Navbar.css"

const Navbar = () => {

    const [user, setUser] = useState(null);
    const navigate = useNavigate();


    const getUserInfo = async () => {
        try {
            const access = localStorage.getItem("access");

            const response = await axios.get(
                "http://127.0.0.1:8000/api/auth/me/",
                {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                }
        );
        if(response.status === 200){
            const data = response.data;
            setUser(data);
            console.log(`Infor about me ${data.username}`)
        }
    } 
    catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                navigate("/", { replace: true });
            }
        }
    };
    const handleClick = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate('/',{replace: true})
    }
    
    useEffect (()=>{
        getUserInfo();
    },[])

    return( 
        <>
        <nav className="navbar">
            <Link to="/procedures">
                <img src={heximus} alt="Heximus" className="logo" />
            </Link>
            <span>IT Procedure Creation and Execution Platform</span>
            <div>
                <span>{user?.username}</span>
            <button onClick={handleClick}>    
                Log out
            </button>
            </div>
        </nav>
        <div>
        <button onClick={() => navigate("/profile")}>
                Profile
            </button>
        </div>
        </>
    )
}
export default Navbar
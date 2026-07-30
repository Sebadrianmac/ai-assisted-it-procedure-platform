import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Navbar = () => {

    const [user, setUser] = useState(null);
    const navigate = useNavigate();


    const getUserInfo = async () =>{
        const access = localStorage.getItem("access");
        const responce = await axios.get(
            'http://127.0.0.1:8000/api/auth/me/',
            {
                headers: {
                    Authorization : `Bearer ${access}`
                }
            }
            
        );
        if(responce.status === 200){
            const data = responce.data;
            setUser(data);
            console.log(`Infor about me ${data.username}`)
        }
    }
    const handleClick = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate('/',{replace: true})
    }
    
    useEffect (()=>{
        getUserInfo();
    },[])

    return(
        <nav>
            <span>{user?.username}</span>
            <hr />
            <button onClick={handleClick}>    
                Log out
            </button>
            <button onClick={() => navigate("/profile")}>
                Profile
            </button>
        </nav>
    )
}
export default Navbar
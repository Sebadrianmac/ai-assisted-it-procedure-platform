import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "./components/Navbar";

const ProfilePage = () => {

    const[user, setUse] = useState(null)

    const getUserInfor = async () => {
        const access = localStorage.getItem("access");
        try{
        const responce = await axios.get(
            'http://127.0.0.1:8000/api/auth/me',
            {
                headers: {
                    Authorization: `Bearer ${access}`
                }
            }
        )
            if(responce.status === 200){
                const data = responce.data;
                setUse(data);
            }
        }catch{
            console.error("Failed to load profile:", error);
        }
    }
    
    useEffect(()=>{
        getUserInfor()
    },[])

    return(
        <div>
            <Navbar />
            <p>{user?.username}</p>
            <p>{user?.first_name}</p>
            <p>{user?.last_name}</p>
            
            <p>{user?.date_joined}</p>
            <p>{user?.email}</p>
        </div>
        
    )

}
export default ProfilePage
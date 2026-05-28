import { Avatar as MuiAvatar } from "@mui/material";
import { useSession } from "next-auth/react";

function stringToColor(string: string) {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";
    for (let i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }

    return color;
}

function stringAvatar(name: string) {
    const splitted = name.split(" ");
    return {
        sx: {
            bgcolor: stringToColor(name),
        },
        children: `${splitted[0][0]}${splitted[1]?.[0] || ""}`,
    };
}

export default function Avatar({...props}) {
    const { data: session } = useSession();
    const name = session?.user?.name;
    if (!name) return null;
    return <MuiAvatar {...props} {...stringAvatar(name)} />;
}
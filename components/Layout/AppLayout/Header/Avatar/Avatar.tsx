import { Avatar as MuiAvatar } from "@mui/material";

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

function stringAvatar(name: string, border: string, size: number) {
    const splitted = name.split(" ");
    return {
        sx: {
            bgcolor: stringToColor(name),
            border: border ? `2px solid ${border}` : 'none',
            height: size ? `${size}px` : '40px',
            width: size ? `${size}px` : '40px',
        },
        children: `${splitted[0][0]}${splitted[1]?.[0] || ""}`,
    };
}

export default function Avatar({ ...props }) {
    if (!props.name) return null;
    return <MuiAvatar {...props} {...stringAvatar(props.name, props.border, props.size)} />;
}
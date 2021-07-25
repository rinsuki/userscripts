export const SectionHeader: React.FC<{icon: string, name: string}> = ({icon, name}) => {
    return <div style={{
        backgroundColor: document.body.style.backgroundColor || "#17191f",
        fontSize: 16,
        padding: 15,
        color: "white",
    }}>
        <i className={`fa fa-${icon}`} style={{marginRight: 5}}/>
        {name}
    </div>
}

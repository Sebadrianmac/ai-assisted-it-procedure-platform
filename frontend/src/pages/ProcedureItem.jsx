const ProcedureItem = (props) => {
    const {
        id,
        title
    } = props
   
 return(
    <li>
        <a href="">{id} - {title}</a>
    </li>
 )   
}
export default ProcedureItem
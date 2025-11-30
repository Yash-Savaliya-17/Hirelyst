import axios from "axios";

(async () => {
    const analysisData = {
        "question": "Describe the role of indexes in query optimization.",
        "answer": "Indexes are data structures that store the mapping between a column value and the corresponding row location. They speed up query execution by allowing the database to directly access rows without having to scan the entire table. Indexes can be created on individual columns, and multiple indexes can be created on the same table.",
        "user_answer": "indexes are data structure that store the mapping between a column value and corresponding row location so they speed up query execution by allowing the database to directly access row without having to scan the entire table"
    }
    const analysisResponse = await axios.post(`http://localhost:5001/analyze`, analysisData, {
        headers: { "Content-Type": "application/json" }
    });
    console.log(analysisResponse)

})()

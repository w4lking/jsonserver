// authLogs.js

// Função para adicionar logs de login
function addLoginLogs(db, params) {
    return new Promise((resolve, reject) => {
        db.query(
            'INSERT INTO login_logs (user_id, action, action_timestamp, action_status) VALUES (?, ?, ?, ?)',
            [params.id_usuario, params.action, new Date(), params.action_status],
            (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            }
        );
    });
}


// Exportando a função addLoginLogs
module.exports = addLoginLogs;

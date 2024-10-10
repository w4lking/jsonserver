// const express = require('express');
// const uniqueId = require('./uniqueID');

// const authLogs = require('./authLogs');

// function createRouter(db) {
    
//     const router = express.Router();

//     router.post('/api/user/register', (req, res, next) => {

//         if(req.body===null || req.body===''){
//             res.status(400).json({status: 'error: data null'});
//         }

//         var uid = uniqueId()
//         var new_uid = uid.slice(14) + "-" + Date.now().toString(36)

//         db.query(
//             'INSERT INTO usuarios (id, cpf, nome, email, senha, telefone, perfil, ativo, bloqueado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [new_uid, req.body.cpf, req.body.nome, req.body.email, req.body.senha, req.body.telefone, req.body.perfil, 0, 0], 
//             new Date((error) => {
//                 if(error){
//                     if(error.code === 'ER_DUP_ENTRY'){
//                         res.status(500).json({status: 'error: email ou número de telefone já cadastrado'});
//                     }
//                     else{
//                         res.status(500).json({status: 'error', message:'erro ao cadastrar usuário'});
//                     }
//                 }
//                 else{
//                     res.status(200).json({status: 'ok', message:'usuário cadastrado com sucesso'});
//                 }
//             })
//         )
//     });
// }
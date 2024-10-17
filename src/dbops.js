const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const addLoginLogs = require('./authLogs'); // Função para log de login
require('dotenv').config(); // Para carregar variáveis de ambiente
const app = express();

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// let transport = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'agronline55@gmail.com',  // seu email
//     pass: 'gskq tduw urpb rner'        // sua senha de app
//   },
//   connectionTimeout: 60000,  // Aumenta o timeout para 60 segundos
//   timeout: 60000,
//   greetingTimeout: 30000
// });

// transport.sendMail({
//   from: 'AGROline <agronline55@gmail.com>',
//   to: 'walkerlayon@gmail.com',
//   subject: 'Email Teste Nodemailer',
//   html: '<b>Olá, seja bem-vindo ao AGROline</b>',
//   attachments: [
//     {
//       filename: 'bemvindo.html',
//       path: './bemvindo.html'
//     }
//   ]
// }, function(error, info) {
//   if (error) {
//     console.log('Erro ao enviar email:', error);
//   } else {
//     console.log('Email enviado com sucesso:', info.response);
//   }
// });

// Middleware para JSON
app.use(express.json());
const saltRounds = 10;

function createRouter(db) {
    const router = express.Router();

    // Função authLogs
    async function authLogs(db, params) {
        try {
            await addLoginLogs(db, params);
            console.log("Log de login armazenado com sucesso.");
        } catch (error) {
            console.error("Erro ao armazenar log de login:", error);
        }
    }

    // Rota para obter tipo de usuário pelo email
    router.get('/api/user/type', (req, res) => {
        const email = req.query.email;
        const qryString = 'SELECT perfil FROM usuarios WHERE email = ?';
        db.query(qryString, [email], (error, results) => {
            if (error) return res.status(500).json({ status: 'error', message: 'Database error' });
            res.status(200).json(results[0] || { status: 'error', message: 'User not found' });
        });
    });


    router.get('/api/users/unauthenticated', (req, res) => {
        const qryString = 'SELECT * FROM usuarios WHERE autenticado = 0';
        
        db.query(qryString, (error, results) => {
            if (error) {
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
            
            if (results.length > 0) {
                res.status(200).json(results);
                console.log('Usuários não autenticados:', results);
            } else {
                res.status(404).json({ status: 'error', message: 'No unauthenticated users found' });
            }
        });
      });

      router.post('/api/user/authenticate', (req, res) => {
        const { id } = req.body;
        const qryString = 'UPDATE usuarios SET autenticado = 1 WHERE idusuarios = ?';
        
        // Primeiro, consulte o e-mail do usuário para enviar a notificação
        const getUserEmailQuery = 'SELECT email, nome FROM usuarios WHERE idusuarios = ?';
    
        db.query(getUserEmailQuery, [id], (error, userResults) => {
            if (error) {
                return res.status(500).json({ ok: false, status: 'error', message: 'Database error' });
            }
    
            if (userResults.length === 0) {
                return res.status(404).json({ ok: false, status: 'error', message: 'User not found' });
            }
    
            // Atualiza a autenticação do usuário
            db.query(qryString, [id], (error, results) => {
                if (error) {
                    return res.status(500).json({ ok: false, status: 'error', message: 'Database error' });
                }
        
                if (results.affectedRows > 0) {
                    // Usuário autenticado com sucesso, envia o e-mail
                    const user = userResults[0];
                    sendWelcomeEmail(user.email, user.nome);
                    
                    return res.status(200).json({ ok: true, status: 'success', message: 'User authenticated and email sent' });
                } else {
                    return res.status(404).json({ ok: false, status: 'error', message: 'User not found' });
                }
            });
        });
    });



    // Rota para bloquear/desbloquear o usuário
router.post('/api/user/block', (req, res) => {
    const { id, bloqueado } = req.body;

    if (!id || typeof bloqueado === 'undefined') {
        return res.status(400).json({ ok: false, status: 'error', message: 'User ID and block status are required' });
    }

    const qryString = 'UPDATE usuarios SET bloqueado = ? WHERE idusuarios = ?';
    
    db.query(qryString, [bloqueado, id], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ ok: false, status: 'error', message: 'Database error' });
        }

        if (results.affectedRows > 0) {
            return res.status(200).json({ ok: true, status: 'success', message: 'User block status updated' });
        } else {
            return res.status(404).json({ ok: false, status: 'error', message: 'User not found' });
        }
    });
});


      

      router.get('/api/users', (req, res) => {
        const qryString = 'SELECT * FROM usuarios';
        
        db.query(qryString, (error, results) => {
            if (error) {
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
            
            if (results.length > 0) {
                res.status(200).json(results);
                console.log('Usuários:', results);
            } else {
                res.status(404).json({ status: 'error', message: 'No unauthenticated users found' });
            }
        });
      });
    

      router.get('/api/user/email', (req, res) => {
        const email = req.query.email;
        const qryString = 'SELECT idusuarios FROM usuarios WHERE email = ?';
        
        db.query(qryString, [email], (error, results) => {
            if (error) {
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
            
            // Verifica se o resultado existe e retorna apenas o 'idusuarios'
            if (results.length > 0) {
                res.status(200).json(results[0].idusuarios); // Retorna o valor do campo 'idusuarios'
            } else {
                res.status(404).json({ status: 'error', message: 'User not found' });
            }
        });
    });
    

    router.get('/api/user', (req, res) => {
        const id = req.query.id;
    
        if (!id) {
            return res.status(400).json({ status: 'error', message: 'ID is required' }); // Verifica se o ID foi passado
        }
    
        const qryString = 'SELECT * FROM usuarios WHERE idusuarios = ?';
    
        db.query(qryString, [id], (error, results) => {
            if (error) {
                console.error('Database error:', error); // Log do erro para ajudar na depuração
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
    
            // Verifica se o resultado existe e retorna o usuário ou um erro
            if (results.length > 0) {
                return res.status(200).json({
                    status: 'success',
                    message: 'User found',
                    usuario: results[0] // Retorna os dados do usuário em um objeto nomeado
                });
            } else {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }
        });
    });


    router.delete('/api/user/delete', (req, res) => {
        const id = req.query.id;
        if (id === undefined) {
            return res.status(400).json({ status: 'error', message: 'ID is required' });
        }
    
        const qryString = 'DELETE FROM usuarios WHERE idusuarios = ?';
        db.query(qryString, [id], (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
    
            if (results.affectedRows > 0) {
                res.status(200).json({ status: 'success', message: 'User deleted successfully' });
            } else {
                res.status(404).json({ status: 'error', message: 'User not found' });
            }
        });
    });


    router.get('/api/farm', (req, res) => {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ status: 'error', message: 'ID is required' });
        }
    
        const qryString = 'SELECT * FROM fazendas WHERE usuarios_idusuarios = ?';
        db.query(qryString, [id], (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
    
            if (results.length > 0) {
                res.status(200).json({ status: 'success', fazendas: results });
            } else {
                res.status(404).json({ status: 'error', message: 'Fazendas not found' });
            }
        });
    });

    // adicionar fazendas

    router.post('/api/farm/add', (req, res) => {
        const { nome, cep, endereco, valor, id } = req.body;
    
        if (!nome || !cep || !endereco || valor === undefined || !id) {
            return res.status(400).json({ status: 'error', message: 'Todos os campos são obrigatórios.' });
        }
    
        const qryString = 'INSERT INTO fazendas (nome, cep, endereco, valor, usuarios_idusuarios) VALUES (?, ?, ?, ?, ?)';
    
        db.query(qryString, [nome, cep, endereco, valor, id], (error, results) => {
            if (error) {
                console.error('Erro ao adicionar fazenda:', error);
                return res.status(500).json({ status: 'error', message: 'Erro ao adicionar a fazenda.' });
            }
    
            res.status(201).json({ status: 'success', message: 'Fazenda adicionada com sucesso.', id: results.insertId });
        });
    });

    // Trocar GET por DELETE
    router.delete('/api/delete', (req, res) => {
        console.log('Recebendo requisição para deletar fazenda com ID:', req.query.idfazendas); // Log adicionado
        const id = req.query.idfazendas;
        if (!id) {
            return res.status(400).json({ status: 'error', message: 'ID is required' });
        }
        const qryString = 'DELETE FROM fazendas WHERE idfazendas = ?';
        db.query(qryString, [id], (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }

            // Verifica se alguma linha foi afetada pela deleção
            if (results.affectedRows > 0) {
                res.status(200).json({ status: 'success', message: 'Fazenda deletada com sucesso' });
            } else {
                res.status(404).json({ status: 'error', message: 'Fazenda não encontrada' });
            }
        });
    });

    // Rota para atualizar fazendas
    // router.put('/api/farm/update', (req, res) => {
    //     const { nome, cep, endereco, valor, id } = req.body;
    
    //     if (!nome || !cep || !endereco || valor === undefined || !id) {
    //         return res.status(400).json({ status: 'error', message: 'Todos os campos são obrigatórios.' });
    //     }
    
    //     const qryString = 'UPDATE fazendas SET nome = ?, cep = ?, endereco = ?, valor = ? WHERE idfazendas = ?';
    
    //     db.query(qryString, [nome, cep, endereco, valor, id], (error, results) => {
    //         if (error) {
    //             console.error('Erro ao atualizar fazenda:', error);
    //             return res.status(500).json({ status: 'error', message: 'Erro ao atualizar a fazenda.' });
    //         }
    
    //         res.status(200).json({ status: 'success', message: 'Fazenda atualizada com sucesso.' });
    //     });
    // });


    router.get('/api/employees', (req, res) => {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ status: 'error', message: 'ID is required' });
        }
    
        const qryString = 'SELECT * FROM funcionarios WHERE fazendas_usuarios_idusuarios = ?';
        db.query(qryString, [id], (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
    
            if (results.length > 0) {
                res.status(200).json({ status: 'success', funcionarios: results });
            } else {
                res.status(404).json({ status: 'error', message: 'Nenhum funcionario encontrado not found' });
            }
        });
    });

    router.post('/api/employees/add', (req, res) => {
        const { nome, cpf, email, telefone, salario, senha, idfazendas, idusuario } = req.body;
        
        console.log('Dados recebidos:', { nome, cpf, email, telefone, salario, senha, idfazendas, idusuario });  // Adicione este log
    
        if (!nome || !cpf || !email || !telefone || salario < 1 || !senha || !idfazendas || !idusuario) {
            return res.status(400).json({ status: 'error', message: 'Todos os campos são obrigatórios.' });
        }
    
        const qryString = 'INSERT INTO funcionarios (nome, cpf, email, telefone, salario, senha, fazendas_idfazendas, fazendas_usuarios_idusuarios) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
        db.query(qryString, [nome, cpf, email, telefone, salario, senha, idfazendas, idusuario], (error, results) => {
            if (error) {
                console.error('Erro ao adicionar funcionario:', error);
                return res.status(500).json({ status: 'error', message: 'Erro ao adicionar a funcionario.' });
            }
    
            res.status(201).json({ status: 'success', message: 'Funcionário adicionado com sucesso.', id: results });
        });
    });

    router.delete('/api/employees/delete', (req, res) => {
        console.log('Recebendo requisição para deletar empregado com ID:', req.query.id); // Log adicionado
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ status: 'error', message: 'ID is required' });
        }
        const qryString = 'DELETE FROM funcionarios WHERE idfuncionarios = ?';
        db.query(qryString, [id], (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }

            // Verifica se alguma linha foi afetada pela deleção
            if (results.affectedRows > 0) {
                res.status(200).json({ status: 'success', message: 'Funcionario deletado com sucesso' });
            } else {
                res.status(404).json({ status: 'error', message: 'Funcionario não encontrado' });
            }
        });
    });
    
    
    

    // Rota para autenticar o usuário
router.post('/api/user/login', (req, res) => {
    const { email, senha } = req.body;

    // Verifica se o e-mail e a senha foram enviados
    if (!email || !senha) {
        return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    // Consulta para buscar o usuário pelo e-mail
    const qryString = 'SELECT idusuarios, email, senha, perfil, autenticado, bloqueado FROM usuarios WHERE email = ?';
    db.query(qryString, [email], async (error, results) => {
        if (error) {
            return res.status(500).json({ status: 'error', message: 'Database error' });
        }

        // Verifica se o usuário existe
        if (results.length === 0) {
            return res.status(401).json({ status: 'error', message: 'User not found' });
        }

        const user = results[0];

        // Verifica se o usuário está autenticado e não está bloqueado
        if (user.bloqueado === 1) {
            return res.status(403).json({ status: 'error', message: 'User is blocked' });
        }

        if (user.autenticado === 0) {
            return res.status(403).json({ status: 'error', message: 'User is not authenticated' });
        }

        // Compara a senha fornecida com a senha armazenada
        const isCorrectPass = await bcrypt.compare(senha, user.senha);

        if (isCorrectPass) {
            // Se a senha estiver correta, gerar o token JWT
            const token = jwt.sign({ id: user.idusuarios, perfil: user.perfil }, 'seu-segredo-jwt', { expiresIn: '1h' });

            return res.status(200).json({
                ok: true,
                message: 'Login successful',
                token,
                perfil: user.perfil
            });
        } else {
            return res.status(401).json({ status: 'error', message: 'Invalid password' });
        }
    });
});


    // Rota para adicionar um novo usuário ------------Funcionando corretamente ------------------
    router.post('/api/user/register', (req, res) => {
        const { cpf, nome, email, senha, telefone, perfil } = req.body;
        const hashedPassword = bcrypt.hashSync(senha, saltRounds);
    
        // Verifica se já existe um CPF, e-mail ou telefone no banco de dados
        db.query(
            'SELECT * FROM usuarios WHERE cpf = ? OR email = ? OR telefone = ?',
            [cpf, email, telefone],
            (error, results) => {
                if (error) {
                    console.error('Erro na query SQL:', error);
                    return res.status(500).json({ status: 'error', message: 'Erro ao verificar o usuário' });
                }
    
                // Se algum resultado for encontrado, retorna erro
                if (results.length > 0) {
                    // Verifica o que já está cadastrado (CPF, e-mail ou telefone)
                    let message = 'Já existe um cadastro com os seguintes campos: ';
                    if (results[0].cpf === cpf) message += 'CPF ';
                    if (results[0].email === email) message += 'Email ';
                    if (results[0].telefone === telefone) message += 'Telefone ';
                    
                    return res.status(409).json({ status: 'error', message: message.trim() });
                }
    
                // Se não encontrar duplicata, prossegue com o cadastro
                db.query(
                    'INSERT INTO usuarios (nome, cpf, email, telefone, senha, perfil, bloqueado, autenticado) VALUES (?, ?, ?, ?, ?, ?, 0, 0)',
                    [nome, cpf, email, telefone, hashedPassword, perfil],
                    (error) => {
                        if (error) {
                            console.error('Erro na query SQL:', error);
                            return res.status(500).json({ status: 'error', message: 'Erro ao cadastrar usuário' });
                        }
                        res.status(200).json({ status: 'ok', message: 'Usuário cadastrado com sucesso' });
                    }
                );
            }
        );
    });

// Função para enviar o e-mail de boas-vindas
function sendWelcomeEmail(email, nome) {
    // Criar o transportador do Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'agronline55@gmail.com', // seu email
            pass: 'gskq tduw urpb rner'    // sua senha de app
        }
    });

    // Ler o arquivo HTML bemvindo.html que está fora do src
    const filePath = path.join(__dirname, '../bemvindo.html');
    const htmlContent = fs.readFileSync(filePath, 'utf-8');

    // Definir as opções de e-mail
    const mailOptions = {
        from: 'AGROline <agronline55@gmail.com>',
        to: email,
        subject: 'Bem-vindo ao AGROline',
        html: htmlContent.replace('{{nome}}', nome) // Substituir o nome do usuário no HTML
    };

    // Enviar o e-mail
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Erro ao enviar email:', error);
        } else {
            console.log('Email enviado com sucesso:', info.response);
        }
    });
}
    

    return router;
}

module.exports = createRouter;

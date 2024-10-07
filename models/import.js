const { Sequelize, DataTypes, Op } = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');

const MYSQL_IP = "localhost";
const MYSQL_LOGIN = "root";
const MYSQL_PASSWORD = "root";
const DATABASE = "people";
const sequelize = new Sequelize(DATABASE, MYSQL_LOGIN, MYSQL_PASSWORD, { host: MYSQL_IP, dialect: "mysql" });

const prompt = require('prompt-sync')({sigint: true});

const People = sequelize.define('people', { //
    index: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    userId: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    sex: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    dateOfBirth: { type: DataTypes.DATE, allowNull: false },
    jobTitle: { type: DataTypes.STRING, allowNull: false }
}, {tableName: 'people',timestamps: false});

async function main() {
    let exit = false;
    while (!exit) {
        console.log("Seja bem-vindo ao gerenciador do MySQL!\n\n");
        console.log("Escolha uma das 4 opções abaixo:\n");
        console.log("1 - Importar Banco de Dados\n");
        console.log("2 - Listar Banco de Dados\n");
        console.log("3 - Filtrar os dados por nome\n");
        console.log("4 - Encerrar a execução\n");

        let opcao = prompt('Digite uma das opções acima: ');

        if (opcao === "1") await csvBulkCreate();
        if (opcao === "2") {
            await peopleListAll();
        }
        if (opcao === "3"){
                let nome = prompt('Digite o nome para pesquisar: ');
                await peopleFilterByName(nome);
        }
        if (opcao === "4") exit = true;
    }
}

//Usando bulkCreate (Ps: Promise usado pro await funcionar direito pq antes tava cortado pela metade):
const csvBulkCreate = () => new Promise((resolve, reject) => {
    try {
        // Create table
        sequelize.authenticate()
            .then(() => {
                console.log('Conexão estabelecida.');
                return People.sync();
            })
            .then(() => {
                return People.truncate();
            })
            .then(() => {
                console.log("Table 'people' foi criada com sucesso.");
                let records = [];
                // Read CSV file and import data
                fs.createReadStream('people-100000.csv')
                    .pipe(csv({ headers: false, skipLines: 1 })) // Pulando o header
                    .on('data', (row) => {
                        try {
                            const rowData = row[0].split(','); // Divisão de coluna por vírgula
                            const index = rowData[0];
                            const userId = rowData[1];
                            const firstName = rowData[2];
                            const lastName = rowData[3];
                            const sex = rowData[4];
                            const email = rowData[5];
                            const phone = rowData[6];
                            const dateOfBirth = new Date(rowData[7]);
                            let jobTitle = rowData.slice(8).join(','); //Ignorando a vírgula pra pegar a frase completa
                            jobTitle = jobTitle.replace(/"/g, ''); //Tirando as aspas
                            records.push({
                                index,
                                userId,
                                firstName,
                                lastName,
                                sex,
                                email,
                                phone,
                                dateOfBirth,
                                jobTitle
                            });
                        } catch (error) {
                            console.error('Error processing row:', error);
                        }
                    })
                    .on('end', async () => {
                        try {
                            console.log('Records to be inserted:', records);
                            await People.bulkCreate(records);
                            console.log('CSV file imported successfully.');
                            resolve();
                        } catch (error) {
                            console.error('Error bulk inserting records:', error);
                            reject(error);
                        }
                    });
            })
            .catch(error => {
                console.error('Error:', error);
                reject(error);
            });
    } catch (error) {
        console.error('Error importing data from CSV:', error);
        reject(error);
    }
});

async function peopleListAll(){
    let testConnection = async function() {
        try {
            console.log("=== People ===");
            const people = await People.findAll();
            people.forEach(people => {
                console.log("People LOAD", people.dataValues);
            });
        } catch (error) { console.error("Error log", error);}
    };
    await testConnection();
}

async function peopleFilterByName(name){
    let testConnection = async function() {
        try {
            let returnedEntries = await People.findAll({
                where: {
                    [Op.or]: [
                        { firstName: { [Op.like]: `%${name}%` } },
                        { lastName: { [Op.like]: `%${name}%` } }
                    ]
                }
            });
            console.log("returnedEntries", returnedEntries);
        } catch (error) { console.error("Error log", error);}
    };
    await testConnection();
}

main();
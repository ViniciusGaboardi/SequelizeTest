const { Sequelize, DataTypes} = require('sequelize'); //npm install --save sequelize , npm install --save mysql2
const { Op } = Sequelize;

const MYSQL_IP="localhost";
const MYSQL_LOGIN="root";
const MYSQL_PASSWORD= "root";
const DATABASE = "sakila";
const sequelize = new Sequelize(DATABASE, MYSQL_LOGIN, MYSQL_PASSWORD,{host:MYSQL_IP, dialect: "mysql"});

const prompt = require('prompt-sync')({sigint: true});

const Address = sequelize.define('Address', {
  address_id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  address: {type: DataTypes.STRING},
  address2: {type: DataTypes.STRING},
  location: {type: DataTypes.BLOB},
  district: { type: DataTypes.STRING},
  city_id: { type: DataTypes.INTEGER},
  phone: {type: DataTypes.STRING},
  postal_code: {type: DataTypes.STRING, allowNull: false}
}, { tableName: 'address',timestamps: false});

const City = sequelize.define('City',{
  city_id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  city: {type: DataTypes.STRING},
  country_id: { type: DataTypes.INTEGER}
},{ tableName: 'city',timestamps: false});

const Country = sequelize.define('Country',{
  country_id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  country: {type: DataTypes.STRING}
},{tableName: 'country',timestamps: false});

/*Customer.belongsTo(Rental,{foreignKey: 'customer_id'});*/
Address.belongsTo(City, {foreignKey: 'city_id'});
City.belongsTo(Country, {foreignKey: 'country_id'});
Country.hasMany(City, {foreignKey: 'country_id'});
City.hasMany(Address, {foreignKey: 'city_id'});

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let exit = false;

main();

async function main() {
  let exit = false;
  while (!exit) {
    console.log("Seja bem-vindo ao gerenciador do MySQL!\n\n");
    console.log("Escolha uma das 3 opções abaixo:\n");
    console.log("1 - Listar Banco de Dados\n");
    console.log("2 - Inserir no Banco de Dados\n");
    console.log("3 - Encerrar a execução\n");

    let opcao = prompt('Digite uma das opções acima: ');

    if (opcao === "1") {
      console.log("1 - Listar endereços\n");
      console.log("2 - Listar cidades\n");
      console.log("3 - Listar paises\n");

      let opcao2 = prompt('Digite uma das opções acima: ');

      if (opcao2 === "1") {
        await addressListAll();
      }
      if (opcao2 === "2") {
        await cityListAll();
      }
      if (opcao2 === "3") {
        await countryListAll();
      }
    }

    if (opcao === "2") {
      console.log("1 - Novo endereço\n");
      console.log("2 - Nova cidade\n");
      console.log("3 - Novo país\n");

      let opcao2 = prompt('Digite uma das opções acima: ');

      if (opcao2 === "1") {
        let endereco = prompt('Escreva o endereço: ');
        let endereco2 = prompt('Escreva o segundo endereço: ');
        let distrito = prompt('Escreva o distrito: ');
        let cidade_id = prompt('Escreva o id da cidade: ');
        let telefone = prompt('Escreva o telefone: ');
        let codigo_postal = prompt('Escreva o codigo_postal: ');
        await insertAddress(endereco, endereco2, distrito, cidade_id, telefone, codigo_postal);
      }
      if (opcao2 === "2") {
        let cidade = prompt('Escreva o nome da cidade: ');
        let pais_id = prompt('Escreva o id do país: ');
        await insertCity(cidade, pais_id);
      }
      if (opcao2 === "3") {
        let pais = prompt('Escreva o nome do País: ');
        await insertCountry(pais);
      }
    }

    if (opcao === "3") exit = true;
  }
}

async function addressListAll() {
  let testConnection = async function() {
    try {
      console.log("=== Addresses ===");
      const addresses = await Address.findAll({include: [{model: City, attributes: ['city_id']}]});
      // Loop through addresses
      addresses.forEach(address => {
        console.log("Address LOAD", address.dataValues);
        if (address.City) {
          console.log("City", address.City.dataValues); // This will only contain the specified attributes
        }
      });
    } catch (error) { console.error("Error log", error);}
  };
  await testConnection();
}

async function cityListAll() {
  let testConnection = async function() {
    try {
      console.log("=== CITIES ===");
      const cities = await City.findAll({ include: [{model: Address, attributes: ['address_id']}, {model: Country, attributes: ['country_id']}] });
      cities.forEach(city => {
        console.log("City LOAD", city.dataValues);
        if (city.Addresses && city.Addresses.length > 0) {
          console.log("Addresses:");
          city.Addresses.forEach(address => {
            console.log(" - Address:", address.dataValues);
          });
        } else {
          console.log("No addresses associated with this city.");
        }
        if (city.Country) {
          console.log("Country", city.Country.dataValues);
        }
      });
    } catch (error) { console.error("Error log", error);}
  };
  await testConnection();
}

async function countryListAll() {
  let testConnection = async function() {
    try {
      console.log("=== COUNTRIES ===");
      const countries = await Country.findAll({ include: {model: City, attributes: ['city_id']}});
      countries.forEach(country => {
        console.log("Country LOAD", country.dataValues);
        if (country.Cities && country.Cities.length > 0) {
          console.log("Cities:");
          country.Cities.forEach(city => {
            console.log("City", city.dataValues);
          });
        }
      });
    } catch (error) { console.error("Error log", error);}
  };
  await testConnection();
}

async function insertAddress(endereco, endereco2, distrito, cidade_id, telefone, codigo_postal){
  let testConnection = async function(){
    try {
      await sequelize.authenticate();
      console.log('Conexão estabelecida.');

      const location = Sequelize.fn('ST_GeomFromText', 'POINT(0 0)');

      let address = {
        address: endereco,
        address2: endereco2,
        location: location,
        district: distrito,
        city_id: cidade_id,
        phone: telefone,
        postal_code: codigo_postal
      };
      let returnedObject = await Address.create(address);
      console.log('Novo endereço:', address, returnedObject);
      let generatedKey = returnedObject.dataValues.address_id;
      console.log("Generated key", generatedKey);
      let addressLoaded = await Address.findByPk(generatedKey);
      console.log("addressLoaded",addressLoaded);
    }
    catch (error) {console.error("Error log", error);}
  }
  await testConnection();
}

async function insertCity(cidade, pais_id){
  let testConnection = async function() {
    try {
      await sequelize.authenticate();
      console.log('Conexão estabelecida.');
      let city = {
        city: cidade,
        country_id: pais_id
      };
      let returnedObject = await City.create(city);
      console.log('Nova cidade:', city, returnedObject);
      let generatedKey = returnedObject.dataValues.city_id;
      console.log("Generated key", generatedKey);
      let cityLoaded = await City.findByPk(generatedKey);
      console.log("cityLoaded", cityLoaded);
    }
    catch (error) {console.error("Error log", error);}
  }
  await testConnection();
}

async function insertCountry(pais){
  let testConnection = async function(){
    try{
      await sequelize.authenticate();
      console.log('Conexão estabelecida.');
      let country = {country: pais};
      let returnedObject = await Country.create(country);
      console.log('Novo País:', country, returnedObject);
      let generatedKey = returnedObject.dataValues.country_id;
      console.log("Generated key", generatedKey);
      let countryLoaded = await Country.findByPk(generatedKey);
      console.log("countryLoaded", countryLoaded);
    }
    catch (error) {console.error("Error log", error);}
  }
  await testConnection();
}
import mysql from 'mysql2';

class column{
    constructor(nombre, tipo){
        this.nombre = nombre;
        this.tipo = tipo;
    }
}

class table{
    #database;

    constructor(nombre, columns, primary_key = {nombre, tipo}, database){
        this.columns = {};
        this.#database = database;
        this.primary_key = primary_key;
        this.table_nombre = nombre;
        
        this.columns[primary_key.nombre] = new column(primary_key.nombre, primary_key.tipo);
        Object.keys(columns).forEach(column_name=>{
            var table_column = new column(column_name, columns[column_name]);
            this.columns[column_name] = table_column;
        });
    }

    select(options = {columns: [], where: {}, innerjoin: {tablejoin: undefined, columns: []}}){
        return new Promise((res, rej)=>{
            var columns = (options.columns===undefined) ? [] : options.columns;
            var where = (options.where===undefined) ? {} : options.where;
            var innerjoin = (options.innerjoin===undefined) ? {tablejoin: undefined, columns: []} : options.innerjoin;

            var sqlcolumns = 'SELECT';
            // COLUMNS
            if(columns.length==0){
                Object.keys(this.columns).forEach(column_name=>{
                    sqlcolumns += ` ${this.table_nombre}.${column_name},`;
                });
            }else{
                columns.forEach(column_name=>{
                    sqlcolumns += ` ${this.table_nombre}.${column_name},`;
                });
            }

            // INNER JOIN
            var join = '';
            if(innerjoin.tablejoin!==undefined){
                if(innerjoin.columns===undefined || innerjoin.columns.length==0){
                    Object.keys(innerjoin.tablejoin.columns).forEach(column_name=>{
                        sqlcolumns += ` ${innerjoin.tablejoin.table_nombre}.${column_name},`;
                    });
                }else{
                    innerjoin.columns.forEach(column_name=>{
                        sqlcolumns += ` ${innerjoin.tablejoin.table_nombre}.${column_name},`;
                    });
                }
                join = `INNER JOIN ${innerjoin.tablejoin.table_nombre} ON ${this.table_nombre}.${this.primary_key.nombre} = ${innerjoin.tablejoin.table_nombre}.${innerjoin.tablejoin.primary_key.nombre} `;
            }
            sqlcolumns = sqlcolumns.slice(0, sqlcolumns.length-1);

            // WHERE
            var from = ` FROM ${this.table_nombre} `;
            var sqlwhere = '';
            var keys = Object.keys(where);
    
            keys.forEach(e=>{
                if(typeof where[e]==='number'){
                    sqlwhere += `${(e==keys[0]) ? `WHERE ${this.table_nombre}.${e} = ${where[e]} ` : `AND ${this.table_nombre}.${e} = ${where[e]} `}`
                }else{
                    sqlwhere += `${(e==keys[0]) ? `WHERE ${this.table_nombre}.${e} = '${where[e]}' ` : `AND ${this.table_nombre}.${e} = '${where[e]}' `}`
                }
            });
            
            var sql = sqlcolumns + from + join + sqlwhere;

            this.#database.pool.execute(sql, (err, data)=>{
                if(err) rej(err);
                res(data);
            });
        });
    }

    insert(values = {}){
        return new Promise((res, rej)=>{
            var sql = `INSERT INTO ${this.table_nombre}(`;
            var sql_aux = ') VALUES (';
            Object.keys(values).forEach(e=>{
                sql += `${e}, `;
                sql_aux += `${(typeof values[e]==='number') ? `${values[e]}, ` : `'${values[e]}', `}`
            });
            sql = sql.slice(0,sql.length-2) + sql_aux.slice(0,sql_aux.length-2) + ')';

            this.#database.pool.execute(sql, (err, data)=>{
                if(err) rej(err);
                res(data);
            });
        });    
    }

    update(columns = {}, where = {}){
        return new Promise((res, rej)=>{
            var sql = `UPDATE ${this.table_nombre} SET `;
            // COLUMNS
            Object.keys(columns).forEach(e=>{
                sql += `${e} = ${(typeof columns[e]==='number') ? `${columns[e]}, ` : `'${columns[e]}', `}`
            });

            sql = sql.slice(0, sql.length-2) + ' ';
    
            // WHERE
            var keys = Object.keys(where);
    
            keys.forEach(e=>{
                if(vali.isNumeric(where[e].toString())){
                    sql += `${(e==keys[0]) ? `WHERE ${e} = ${where[e]} ` : `AND ${e} = ${where[e]} `}`
                }else{
                    sql += `${(e==keys[0]) ? `WHERE ${e} = '${where[e]}' ` : `AND ${e} = '${where[e]}' `}`
                }
            });
            console.log(sql);
            this.#database.pool.execute(sql, (err, data)=>{
                if(err) rej(err);
                res(data);
            });
        });
    }

    delete(where = {}){
        return new Promise((res, rej)=>{
            var sql = `DELETE FROM ${this.table_nombre} `;
            
            // WHERE
            var keys = Object.keys(where);
    
            keys.forEach(e=>{
                if(typeof where[e]==='number'){
                    sql += `${(e==keys[0]) ? `WHERE ${e} = ${where[e]} ` : `AND ${e} = ${where[e]} `}`
                }else{
                    sql += `${(e==keys[0]) ? `WHERE ${e} = '${where[e]}' ` : `AND ${e} = '${where[e]}' `}`
                }
            });
            
            this.#database.pool.execute(sql, (err, data)=>{
                if(err) rej(err);
                res(data);
            });
        });
    }
}

class database{

    #createpool = (options = {dbname, host, user, password})=>{
        return mysql.createPool({
            host: options.host,
            database: options.dbname,
            user: options.user,
            password: options.password
        });
    }

    constructor(options = {dbname, host, user, password}){
        this.tables = {};
        this.pool = this.#createpool(options);

        this.ADD = {
            TABLE: (table_name, primary_key = {nombre, tipo}, columns = {})=>{
                var db_table = new table(table_name, columns, primary_key, this);
                this.tables[table_name] = db_table;
                return db_table;
            }
        }
    }
}

export default database;

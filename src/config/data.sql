##SQL projeto

create database jubo;

create table clientes (
id int not null auto_increment,
nome varchar(255) not null, 
cnpj varchar(255) unique not null, 
endereco varchar(255),
cep varchar(255),
email varchar(255), 
cidade varchar(255), 
estado varchar(255), 
telefone varchar(255), 
ativo tinyint, 
primary key(id)
);

create table estantes (
id int not null auto_increment, 
periodo varchar(7) not null, 
observacao varchar(255),
cliente_id int not null,
ativa tinyint,
primary key (id), 
foreign key (cliente_id) references clientes(id));

create table produtos (
id int not null auto_increment, 
nome varchar(255) not null, 
preco_custo double not null, 
unidade_medida varchar(4) not null, 
primary key(id));

create table preco_quantidade (
id int not null auto_increment, 
preco_venda double not null, 
quantidade decimal(20,6) not null, 
primary key (id));

create table estante_produto (
estante_id int not null, 
produto_id int not null, 
preco_quantidade_id int not null,
primary key(estante_id, produto_id), 
foreign key (estante_id) references estantes(id) on delete cascade, 
foreign key (produto_id) references produtos(id),
foreign key (preco_quantidade_id) references preco_quantidade(id) on delete cascade
constraint unique_estante_produto unique (estante_id, produto_id);
);


create table users (
  id int not null auto_increment,
  nome varchar(255) not null, 
  email varchar(255) not null, 
  senha varchar(255) not null, 
  admin tinyint not null,
  cliente_id int unique,
  primary key(id),
  foreign key (cliente_id) references clientes(id)
);

create table pedidos (
  id int not null auto_increment,
  status varchar(255),
  data_criacao date not null,
  data_confirmacao date,
  data_cancelamento date,
  data_entrega date,
  valor_total double,
  entregue tinyint,
  cliente_id int not null,
  primary key(id),
  foreign key (cliente_id) references clientes(id)
);

create table item_pedido (
  id int not null auto_increment,
  quantidade decimal(20,6) not null,
  preco_unitario double not null,
  preco_total double not null,
  observacao varchar(255),
  pedido_id int not null,
  produto_id int not null,
  estante_id int not null,
  primary key(id),
  foreign key (pedido_id) references pedidos(id) ON DELETE CASCADE,
  foreign key (produto_id) references produtos(id),
  foreign key (estante_id) references estantes(id),
  constraint unique_produto_id unique (pedido_id, estante_id, produto_id)
);

SELECT estante_id, produtos.nome, produtos.preco_custo, produtos.unidade_medida, preco_quantidade.preco_venda, preco_quantidade.quantidade
FROM estante_produto
INNER JOIN produtos ON estante_produto.produto_id = produtos.id
INNER JOIN preco_quantidade ON estante_produto.id = preco_quantidade.estante_produto_id
WHERE estante_produto.estante_id = 1;

SELECT estantes.id, estantes.periodo, clientes.name, clientes.endereco FROM estantes INNER JOIN clientes ON estantes.cliente_id=clientes.id';

SELECT estantes.id, estantes.periodo, produtos.id, produtos.nome, produtos.preco_custo, produtos.unidade_medida FROM estantes INNER JOIN estante_produto ON estante_produto.estante_id=estantes.id INNER JOIN estante_produto ON estante_produto.produto_id=produtos.id;

select estantes.id, clientes.name, produtos.nome, produtos.preco_custo, produtos.unidade_medida FROM estante_produto INNER JOIN estantes ON estante_produto.estante_id = estantes.id INNER JOIN produtos ON estante_produto.produto_id = produtos.id INNER JOIN clientes ON estantes.cliente_id = clientes.id;



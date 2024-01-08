$(document).ready(function () {
    cardapio.eventos.init();
})

var cardapio = {};

var MEU_CARRINHO = [];
var ITENS = [];
var ITENS_ACOMP = [];
var MEU_ENDERECO = null;
var MEUS_DADOS = null;

var VALOR_CARRINHO = 0;
var VALOR_ENTREGA = 0.01;

var CELULAR_EMPRESA = '5561981542776';

var comentario = '';

cardapio.eventos = {
    init: () => {
        cardapio.metodos.obterItensCardapio();
        cardapio.metodos.carregarBotaoReserva();
        cardapio.metodos.carregarBotaoLigar();
        cardapio.metodos.iniciarConversaWPP();
    }
}

cardapio.metodos = {

    obterItensCardapio: (categoria = 'burgers', vermais = false) => {
        var filtro = MENU[categoria];

        if (!vermais) {
            $("#itensCardapio").html('');
            $("#btnVerMais").removeClass('hidden');
        }

        $.each(filtro, (i, e) => {

            let temp = cardapio.templates.item.replace(/\${imagem}/g, e.img)
                .replace(/\${nome}/g, e.name)
                .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                .replace(/\${id}/g, e.id)

            //paginação inicial (8 itens)
            if (!vermais && i < 8) {
                $("#itensCardapio").append(temp)
            }

            //botão ver mais foi clicado (12 itens)
            if (vermais && i >= 8 && i < 12) {
                $("#itensCardapio").append(temp)
            }

        })

        //remove o ativo
        $(".container-menu a").removeClass('active');

        //seta o menu para o ativo
        $("#menu-" + categoria).addClass('active');
    },

    verMais: () => {

        var ativo = $(".container-menu a.active").attr('id').split('menu-')[1];   // before(menu-burgers)  after([menu-]0 [burgers]1)
        cardapio.metodos.obterItensCardapio(ativo, true);

        $("#btnVerMais").addClass('hidden');

    },

    //diminuir a quantidade do item do cardapio
    diminuirQuantidade: (id) => {

        let qntdAtual = parseInt($("#qntd-" + id).text());

        if (qntdAtual > 0) {
            $("#qntd-" + id).text(qntdAtual - 1);
        }

    },

    //aumentar a quantidade do item do cardapio
    aumentarQuantidade: (id) => {

        console.log(id)

        let qntdAtual = parseInt($("#qntd-" + id).text());
        $("#qntd-" + id).text(qntdAtual + 1);

    },

    //adicionar ao carrinho o item do cardapio
    adicionarAoCarrinho: (id) => {

        let qntdAtual = parseInt($("#qntd-desc-" + id).text());

        if (qntdAtual > 0) {

            //obter categoria ativa
            var categoria = $(".container-menu a.active").attr('id').split('menu-')[1];

            //obtem a lista de itens
            let filtro = MENU[categoria];

            //obtem o item
            let item = $.grep(filtro, (e, i) => { return e.id == id });

            if (item.length > 0) {

                //validar se já existe esse item no carrinho
                let existe = $.grep(MEU_CARRINHO, (elem, index) => { return elem.id == id });

                //caso já exista o item no carrinho, só altera a quantidade
                if (existe.length > 0) {
                    let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == id));
                    MEU_CARRINHO[objIndex].qntd = MEU_CARRINHO[objIndex].qntd + qntdAtual;
                }
                //caso ainda não exista o item no carrinho, adiciona ele
                else {
                    item[0].qntd = qntdAtual;
                    MEU_CARRINHO.push(item[0]);
                }

                let idAcompVariaveis = [];

                // Itera sobre todos os elementos cujo ID começa com 'qntd-acomp-'
                $('[id^="qntd-acomp-"]').each(function () {
                    let variavel = {
                        qntd: parseInt($(this).text())
                    };

                    idAcompVariaveis.push(variavel);
                });
                for (let i = 0; i < idAcompVariaveis.length; i++) {
                    if (idAcompVariaveis[i].qntd > 0) {
                        for (let i = 0; i < ITENS_ACOMP.length; i++) {
                            console.log(ITENS_ACOMP)
                            var qntdAcomp = idAcompVariaveis[i].qntd;

                            if (qntdAcomp > 0) {
                                var idAcomp = ITENS_ACOMP[i].id;

                                let existe = $.grep(MEU_CARRINHO, (elem, index) => { return elem.id == idAcomp });

                                if (existe.length > 0) {
                                    let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == idAcomp));
                                    MEU_CARRINHO[objIndex].qntd = MEU_CARRINHO[objIndex].qntd + idAcompVariaveis[i].qntd;
                                }
                                else {
                                    ITENS_ACOMP[i].qntd = qntdAcomp;
                                    MEU_CARRINHO.push(ITENS_ACOMP[i]);
                                    console.log(MEU_CARRINHO)
                                }
                            }
                        }
                    }
                }

                ITENS_ACOMP = [];


                cardapio.metodos.mensagem('Item adicionado ao carrinho', 'green');
                $("#modalItem").addClass('hidden');

                cardapio.metodos.atualizaBadgeTotal();
            }
        }
    },

    //atualiza o badge de totais dos botões "Meu carrinho"
    atualizaBadgeTotal: () => {

        var total = 0;

        $.each(MEU_CARRINHO, (i, e) => {
            total += e.qntd
        })

        if (total > 0) {
            $(".botao-carrinho").removeClass('hidden');
            $(".container-total-carrinho").removeClass('hidden');
        } else {
            $(".botao-carrinho").addClass('hidden');
            $(".container-total-carrinho").addClass('hidden');
        }

        $(".badge-total-carrinho").html(total);
        $(".badge-produtos").html(total);
    },

    //abrir a modal do carrinho
    abrirCarrinho: (abrir) => {

        if (abrir) {
            $("#modalCarrinho").removeClass('hidden');
            $(".m-footer").removeClass('hidden');
            $("#notificacaoPagamento").addClass('hidden');

            cardapio.metodos.carregarCarrinho();
        } else {
            $("#modalCarrinho").addClass('hidden');

        }
    },

    abrirModalItem: (id) => {
        $("#modalItem").removeClass('hidden');
        ITENS = [];
        var categoria = $(".container-menu a.active").attr('id').split('menu-')[1];

        //obtem a lista de itens
        let filtro = MENU[categoria];

        //obtem o item
        let item = $.grep(filtro, (e, i) => { return e.id == id });

        let itensAcomp = ACOMP[categoria];


        var dataItens = {
            id: item[0].id,
            name: item[0].name,
            img: item[0].img,
            dsc: item[0].dsc,
            price: item[0].price
        };

        ITENS.push(dataItens);

        cardapio.metodos.carregarModalItem(ITENS[0], itensAcomp);
    },

    fecharModalItem: (abrir) => {
        if (!abrir) {
            $("#modalItem").addClass('hidden');
        }
    },

    //carrega a lista de descrição do item do carrinho
    carregarModalItem: (itens, itensAcomp) => {

        $("#descItensCarrinho").html('');
        $("#cardItensAcomp").html('');
        $("#containerFooterDesc").html('');
        $('#valor_total').val('');

        $("#nomeItem").text(itens.name);

        let temp = cardapio.templates.descItem.replace(/\${desc}/g, itens.dsc)
            .replace(/\${nome}/g, itens.name)
            .replace(/\${preco}/g, itens.price.toFixed(2).replace('.', ','))
            .replace(/\${id}/g, itens.id)
            .replace(/\${imagem}/g, itens.img)

        $("#descItensCarrinho").append(temp);

        itensAcomp.forEach((itens) => {
            let temp = cardapio.templates.itensAcomp.replace(/\${nome}/g, itens.name)
                .replace(/\${preco}/g, itens.price.toFixed(2).replace('.', ','))
                .replace(/\${id}/g, itens.id)
                .replace(/\${imagem}/g, itens.img)

            var dataItensAcomp = {
                id: itens.id,
                name: itens.name,
                img: itens.img,
                dsc: itens.dsc,
                price: itens.price
            };

            ITENS_ACOMP.push(dataItensAcomp);

            $("#cardItensAcomp").append(temp);
        });

        let tempBtnAdicionarItem = cardapio.templates.btnAdicionarItem.replace(/\${id}/g, itens.id)
            .replace(/\${preco}/g, itens.price.toFixed(2).replace('.', ','))

        $("#containerFooterDesc").append(tempBtnAdicionarItem);

    },

    //diminuir a quantidade do item do cardapio
    diminuirQuantidadeDesc: (id) => {

        let qntdAtual = parseInt($("#qntd-desc-" + id).text());

        if (qntdAtual > 1) {
            $("#qntd-desc-" + id).text(qntdAtual - 1);
            cardapio.metodos.subtrairBtnTotalDesc(id);
        }

    },

    //aumentar a quantidade do item do cardapio
    aumentarQuantidadeDesc: (id) => {

        let qntdAtual = parseInt($("#qntd-desc-" + id).text());

        $("#qntd-desc-" + id).text(qntdAtual + 1);
        cardapio.metodos.somarBtnTotalDesc(id);

    },

    somarBtnTotalDesc: (id) => {
        let objIndex = ITENS.findIndex((obj => obj.id == id));

        var total = ITENS[objIndex].price;
        var valorAtual = parseFloat($("#totalDesc").text().replace('R$ ', '').replace(',', '.')); // Converte para número
        var valorAtualizado = (total + valorAtual).toFixed(2).replace('.', ',');

        $("#totalDesc").text('R$ ' + valorAtualizado);
    },

    subtrairBtnTotalDesc: (id) => {
        let objIndex = ITENS.findIndex((obj => obj.id == id));

        var total = ITENS[objIndex].price;
        var valorAtual = parseFloat($("#totalDesc").text().replace('R$ ', '').replace(',', '.')); // Converte para número
        var valorAtualizado = (valorAtual - total).toFixed(2).replace('.', ',');

        $("#totalDesc").text('R$ ' + valorAtualizado);
    },

    //diminuir a quantidade do item do cardapio
    diminuirQuantidadeAcomp: (id) => {
        let qntdAtual = parseInt($("#qntd-acomp-" + id).text());
        let btnMais = $(".btn-mais-desc");

        if (qntdAtual > 0) {
            $("#qntd-acomp-" + id).text(qntdAtual - 1);
            cardapio.metodos.subtrairBtnTotalAcomp(id);

            // Remover a classe limite-atingido se a quantidade estiver abaixo do limite
            let totalGeral = cardapio.metodos.calcularTotalGeral();
            if (totalGeral < 8 && btnMais.hasClass("limite-atingido")) {
                btnMais.removeClass("limite-atingido");
            }
        }
    },

    //aumentar a quantidade do item do cardapio
    aumentarQuantidadeAcomp: (id) => {
        let qntdAtual = parseInt($("#qntd-acomp-" + id).text());
        let btnMais = $(".btn-mais-desc");
        let totalGeral = cardapio.metodos.calcularTotalGeral();

        if (totalGeral < 8) {
            $("#qntd-acomp-" + id).text(qntdAtual + 1);
            cardapio.metodos.somarBtnTotalAcomp(id);
            totalGeral++; // Incrementa o total geral

            // Adicionar a classe limite-atingido se o total atingir 8
            if (totalGeral >= 8 && !btnMais.hasClass("limite-atingido")) {
                btnMais.addClass("limite-atingido");
            }
        }
    },

    somarBtnTotalAcomp: (id) => {
        let objIndex = ITENS_ACOMP.findIndex((obj => obj.id == id));

        var total = ITENS_ACOMP[objIndex].price;
        var valorAtual = parseFloat($("#totalDesc").text().replace('R$ ', '').replace(',', '.')); // Converte para número
        var valorAtualizado = (total + valorAtual).toFixed(2).replace('.', ',');

        $("#totalDesc").text('R$ ' + valorAtualizado);
    },

    subtrairBtnTotalAcomp: (id) => {
        let objIndex = ITENS_ACOMP.findIndex((obj => obj.id == id));

        var total = ITENS_ACOMP[objIndex].price;
        var valorAtual = parseFloat($("#totalDesc").text().replace('R$ ', '').replace(',', '.')); // Converte para número
        var valorAtualizado = (valorAtual - total).toFixed(2).replace('.', ',');

        $("#totalDesc").text('R$ ' + valorAtualizado);
    },

    calcularTotalGeral: () => {
        let totalGeral = 0;

        // Iterar sobre todos os itens no cardápio
        $(".add-numero-acomp").each((index, element) => {
            let qntd = parseInt($(element).text());
            totalGeral += qntd;
        });

        return totalGeral;
    },

    //altera os textos e exibe os botões das etapas
    carregarEtapa: (etapa) => {

        if (etapa == 1) {
            $("#lblTituloEtapa").text('Seu carrinho:');
            $("#itensCarrinho").removeClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").addClass('hidden');
            $("#metodoPagamento").addClass('hidden');
            $("#pagamentoPix").addClass('hidden');
            $("#pagamentoCard").addClass('hidden');

            $(".etapa").removeClass('active');
            $(".etapa1").addClass('active');

            $("#btnEtapaPedido").removeClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").addClass('hidden');
        }

        if (etapa == 2) {
            $("#lblTituloEtapa").text('Endereço de entrega:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").removeClass('hidden');
            $("#resumoCarrinho").addClass('hidden');
            $("#metodoPagamento").addClass('hidden');
            $("#pagamentoPix").addClass('hidden');
            $("#pagamentoCard").addClass('hidden');

            $(".etapa").removeClass('active');
            $(".etapa1").addClass('active');
            $(".etapa2").addClass('active');

            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").removeClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").removeClass('hidden');
        }

        if (etapa == 3) {
            $("#lblTituloEtapa").text('Resumo do pedido:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").removeClass('hidden');
            $("#metodoPagamento").addClass('hidden');
            $("#pagamentoPix").addClass('hidden');
            $("#pagamentoCard").addClass('hidden');

            $(".etapa").removeClass('active');
            $(".etapa1").addClass('active');
            $(".etapa2").addClass('active');
            $(".etapa3").addClass('active');

            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").removeClass('hidden');
            $("#btnVoltar").removeClass('hidden');
        }

        if (etapa == 4) {
            $("#lblTituloEtapa").text('Escolha o método de pagamento:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").addClass('hidden');
            $("#metodoPagamento").removeClass('hidden');
            $("#pagamentoPix").addClass('hidden');
            $("#pagamentoCard").addClass('hidden');

            $(".etapa").removeClass('active');
            $(".etapa1").addClass('active');
            $(".etapa2").addClass('active');
            $(".etapa3").addClass('active');

            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").removeClass('hidden');
        }

        if (etapa == 5) {
            $("#lblTituloEtapa").text('Pague usando o QR Code ou o código abaixo:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").addClass('hidden');
            $("#metodoPagamento").addClass('hidden');
            $("#pagamentoPix").removeClass('hidden');
            $("#pagamentoCard").addClass('hidden');

            $(".etapa-finalizando").removeClass('hidden');
            $(".etapa").addClass('hidden');

            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").removeClass('hidden');

            $(".m-footer").addClass('hidden');
            $("#btnFecharCarrinho").addClass('hidden');
            $("#btnCancelarPagamento").removeClass('hidden');
        }

        if (etapa == 6) {
            $("#lblTituloEtapa").text('Preencha os dados abaixo:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").addClass('hidden');
            $("#metodoPagamento").addClass('hidden');
            $("#pagamentoPix").addClass('hidden');
            $("#pagamentoCard").removeClass('hidden');

            $(".etapa-finalizando").removeClass('hidden');
            $(".etapa").addClass('hidden');

            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").removeClass('hidden');

            $(".m-footer").addClass('hidden');
            $("#btnFecharCarrinho").addClass('hidden');
            $("#btnCancelarPagamento").removeClass('hidden');
        }

    },

    //botão de voltar etapa
    voltarEtapa: () => {

        let etapa = $(".etapa.active").length;
        cardapio.metodos.carregarEtapa(etapa - 1);


    },

    //botão de voltar etapa
    voltarEtapaReserva: () => {

        $(".schedule-container").addClass("none");
        $("#btnVoltarReserva").addClass("none");
        $(".wrapper").removeClass("none");
        $("#btnTransparent").removeClass("none");
        $("#schedule-result").text('');
        $(".sBtn-text").text('');


    },

    //carrega a lista de item do carrinho
    carregarCarrinho: () => {

        cardapio.metodos.carregarEtapa(1);

        if (MEU_CARRINHO.length > 0) {

            $("#itensCarrinho").html('');
            $('#valor_total').val('');

            $.each(MEU_CARRINHO, (i, e) => {

                let temp = cardapio.templates.itemCarrinho.replace(/\${imagem}/g, e.img)
                    .replace(/\${nome}/g, e.name)
                    .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                    .replace(/\${id}/g, e.id)
                    .replace(/\${qntd}/g, e.qntd)

                $("#itensCarrinho").append(temp);

                // quando for o último item
                if ((i + 1) == MEU_CARRINHO.length) {
                    cardapio.metodos.carregarValores();
                }

            });

            $("#lista_carrinho").html('');
            var total = (VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2);
            $.each(MEU_CARRINHO, (i, e) => {

                let temp = cardapio.templates.listaCarrinho.replace(/\${nome}/g, e.name)
                    .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                    .replace(/\${qntd}/g, e.qntd)
                    .replace(/\${total}/g, total)

                $("#lista_carrinho").append(temp);

            });
            var totalValue = parseFloat(total.replace(',', '.')) * 100;
            var totalFormatado = (totalValue / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            $('#total_list').text(totalFormatado);
            $('#valor_total').val(total.replace('.', ''));
            console.log(comentario);
        } else {
            $("#itensCarrinho").html('<p class="carrinho-vazio animated fadeIn"><i class="fa fa-shopping-bag animated flip"></i>Seu carrinho está vazio.</p>');
            cardapio.metodos.carregarValores();
        }

    },

    //diminuir a quantidade do item do carrinho
    diminuirQuantidadeCarrinho: (id) => {

        let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());

        if (qntdAtual > 1) {
            $("#qntd-carrinho-" + id).text(qntdAtual - 1);
            cardapio.metodos.atualizarCarrinho(id, qntdAtual - 1);
        } else {
            cardapio.metodos.removerItemCarrinho(id);
        }

    },

    //aumentar a quantidade do item do carrinho
    aumentarQuantidadeCarrinho: (id) => {

        let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());
        $("#qntd-carrinho-" + id).text(qntdAtual + 1);
        cardapio.metodos.atualizarCarrinho(id, qntdAtual + 1);

    },

    //remover item do carrinho
    removerItemCarrinho: (id) => {

        MEU_CARRINHO = $.grep(MEU_CARRINHO, (e, i) => { return e.id != id });
        cardapio.metodos.carregarCarrinho();

        //atualiza o botão carrinho com a quantidade atual
        cardapio.metodos.atualizaBadgeTotal();

    },

    //atualiza o carrinho com a quantidade atual
    atualizarCarrinho: (id, qntd) => {

        let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == id));
        MEU_CARRINHO[objIndex].qntd = qntd;

        //atualiza o botão carrinho com a quantidade atual
        cardapio.metodos.atualizaBadgeTotal();

        //atualiza os valores totais do carrinho
        cardapio.metodos.carregarValores();

    },

    //carregar os valores de SubTotal, Entrega e Total
    carregarValores: () => {

        VALOR_CARRINHO = 0;

        $("#lblSubTotal").text('R$ 0,00');
        $("#lblValorEntrega").text('+ R$ 0,00');
        $("#lblValorTotal").text('R$ 0,00');

        $.each(MEU_CARRINHO, (i, e) => {

            VALOR_CARRINHO += parseFloat(e.price * e.qntd);

            if ((i + 1) == MEU_CARRINHO.length) {
                $("#lblSubTotal").text(`R$ ${VALOR_CARRINHO.toFixed(2).replace('.', ',')}`);
                $("#lblValorEntrega").text(`+ R$ ${VALOR_ENTREGA.toFixed(2).replace('.', ',')}`);
                $("#lblValorTotal").text(`R$ ${(VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2).replace('.', ',')}`);
            }

        })

    },

    //carregar etapa de endereço
    carregarEndereco: () => {

        if (MEU_CARRINHO.length <= 0) {
            cardapio.metodos.mensagem('Seu carrinho está vazio.')
            return $("#txtCEP").val(''),
                $("#txtEndereco").val(''),
                $("#txtBairro").val(''),
                $("#txtNumero").val(''),
                $("#txtCidade").val(''),
                $("#txtComplemento").val(''),
                $("#ddlUf").val(''),
                $("#txtName").val(''),
                $("#txtContato").val('')
        }

        cardapio.metodos.carregarEtapa(2);

    },

    //API ViaCEP
    buscarCep: () => {

        //cria a variavel com o valor do cep
        var cep = $("#txtCEP").val().trim().replace(/\D/g, '');

        //verifica se o CEP possui valor informado
        if (cep != "") {

            //Expressão regular para validar o CEP
            var validaCep = /^[0-9]{8}$/;

            if (validaCep.test(cep)) {

                $.getJSON("https://viacep.com.br/ws/" + cep + "/json/?callback=?", function (dados) {

                    if (!("erro" in dados)) {

                        //Atualizar os campos com os valores informados
                        $("#txtEndereco").val(dados.logradouro);
                        $("#txtBairro").val(dados.bairro);
                        $("#txtCidade").val(dados.localidade);
                        $("#ddlUf").val(dados.uf);
                        $("#txtNumero").focus();

                    } else {
                        cardapio.metodos.mensagem('CEP não encontrado. Preencha os dados manualmente.');
                        $("#txtEndereco").focus();
                    }

                })

            } else {
                cardapio.metodos.mensagem('Formato do CEP inválido.');
                $("#txtCEP").focus();
            }

        } else {
            cardapio.metodos.mensagem('Informe o CEP, por favor.');
            $("#txtCEP").focus();
        }
    },

    //validação antes de prosseguir para etapa 3
    resumoPedido: () => {

        let cep = $("#txtCEP").val().trim();
        let endereco = $("#txtEndereco").val().trim();
        let bairro = $("#txtBairro").val().trim();
        let cidade = $("#txtCidade").val().trim();
        let uf = $("#ddlUf").val().trim();
        let numero = $("#txtNumero").val().trim();
        let complemento = $("#txtComplemento").val().trim();
        let nome = $("#txtName").val().trim();
        let telefone = $("#txtContato").val().trim();

        if (cep.length <= 0) {
            cardapio.metodos.mensagem('Informe o CEP, por favor.');
            $("#txtCEP").focus();
            return;
        }

        if (endereco.length <= 0) {
            cardapio.metodos.mensagem('Informe o Endereco, por favor.');
            $("#txtEndereco").focus();
            return;
        }

        if (bairro.length <= 0) {
            cardapio.metodos.mensagem('Informe o Bairro, por favor.');
            $("#txtBairro").focus();
            return;
        }

        if (cidade.length <= 0) {
            cardapio.metodos.mensagem('Informe a Cidade, por favor.');
            $("#txtCidade").focus();
            return;
        }

        if (numero.length <= 0) {
            cardapio.metodos.mensagem('Informe o Número, por favor.');
            $("#txtNumero").focus();
            return;
        }

        if (uf == "-1") {
            cardapio.metodos.mensagem('Informe o UF, por favor.');
            $("#ddlUf").focus();
            return;
        }

        if (nome.length <= 6) {
            cardapio.metodos.mensagem('Informe o Nome Completo, por favor.');
            $("#txtName").focus();
            return;
        }

        if (telefone.length <= 14) {
            cardapio.metodos.mensagem('Informe um número de telefone válido.');
            $("#txtContato").focus();
            return;
        }

        MEU_ENDERECO = {
            cep: cep,
            endereco: endereco,
            bairro: bairro,
            cidade: cidade,
            uf: uf,
            numero: numero,
            complemento: complemento
        }

        $('#txtNameCd').val(nome)
        $('#txtContatoCd').val(telefone)

        cardapio.metodos.carregarEtapa(3);
        cardapio.metodos.carregarResumo();

    },

    //carrega a etapa de Resumo do pedido
    carregarResumo: () => {

        $("#listaItensResumo").html('');
        $("#listaItensResumoNotificacao").html('');

        $.each(MEU_CARRINHO, (i, e) => {
            let temp = cardapio.templates.itemResumo.replace(/\${imagem}/g, e.img)
                .replace(/\${nome}/g, e.name)
                .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                .replace(/\${qntd}/g, e.qntd)

            $("#listaItensResumo").append(temp);
            $("#listaItensResumoNotificacao").append(temp);
        })

        $("#resumoEndereco").html(`${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`);
        $("#cidadeEndereco").html(`${MEU_ENDERECO.cidade} - ${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`);
        $("#resumoEnderecoNotificacao").html(`${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`);
        $("#cidadeEnderecoNotificacao").html(`${MEU_ENDERECO.cidade} - ${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`);

    },

    //atualiza a Etapa de escolher metodo de pagamento
    carregarMetodoPagamento: () => {
        cardapio.metodos.carregarEtapa(4);
    },

    //atualiza a Etapa Pix
    carregarPagamentoPix: () => {
        cardapio.metodos.carregarEtapa(5);


        var itens = '';
        var texto = '';
        var nomeCompleto = $("#txtName").val().trim();
        var contato = $("#txtContato").val().trim();

        $.each(MEU_CARRINHO, (i, e) => {
            var total = (VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2);
            itens += `${e.name}....... x${e.qntd}  `;
            //último item
            if ((i + 1) == MEU_CARRINHO.length) {

                texto = `Pedido: ${itens}`;

                const dadosCobranca = {
                    calendario: {
                        expiracao: 3600
                    },
                    devedor: {
                        cpf: "12345678909",
                        nome: nomeCompleto
                    },
                    valor: {
                        original: total
                    },
                    chave: 'fff1ec71-9e3f-4333-b303-aca507e52150',
                    solicitacaoPagador: texto
                };

                $.ajax({
                    url: 'https://db5bcgkt60.execute-api.us-east-1.amazonaws.com/dev/processar-cobranca',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(dadosCobranca),
                    success: function (data) {
                        const qrCodeImage = data.qrcodeResult;
                        const resultadoTxid = data.txidResult;
                        const codQRCode = data.codQRCodeResult;
                        const valueResult = dadosCobranca.valor.original;

                        $('#resultado').html(data.mensagem);
                        $('#resultadoQRCode').attr('src', qrCodeImage);
                        $('#tituloCobranca').html(` <p>Pague <b>R$ ${valueResult}</b> via Pix para <b>Luis Thiago Batista de Sena</b></p> `);
                        $('#linksCompartilhamento').find('p').text(codQRCode);

                        let minutes = 60;
                        let seconds = 0;

                        function updateCountdown() {
                            const formattedTime = minutes + ' min. ' + (seconds < 10 ? '0' : '') + seconds + ' seg.';
                            $('#countdownQRCode').text(formattedTime);

                            if (minutes === 0 && seconds === 0) {
                                // O tempo se esgotou, exiba a mensagem e oculte o contador
                                $('.col-qrcode').addClass('hidden');
                                $('.col-qrcodeExpirado').removeClass('hidden');
                                MEU_CARRINHO = [];
                                //atualiza o botão carrinho com a quantidade atual
                                cardapio.metodos.atualizaBadgeTotal();

                                //atualiza os valores totais do carrinho
                                cardapio.metodos.carregarValores();
                            } else {
                                if (seconds === 0) {
                                    minutes--;
                                    seconds = 59;
                                } else {
                                    seconds--;
                                }
                                setTimeout(updateCountdown, 1000);
                            }
                        }

                        updateCountdown();

                        const $copyButton = $('#qrcodeImg button');
                        const $copyLink = $('#linksCompartilhamento .linkCopy');
                        const $iniciarConversaWppPix = $("#btnIniciarConversaWppPix");

                        $copyButton.click(function () {
                            const $tempInput = $('<input>');
                            $tempInput.val(codQRCode);
                            $('body').append($tempInput);
                            $tempInput.select();
                            document.execCommand('copy');
                            $copyButton.html(`<i class="fa-solid fa-circle-check"></i> &nbsp Copiado!`);
                            $tempInput.remove();

                            setTimeout(function () {
                                $copyButton.html(`<i class="fa-solid fa-copy"></i> &nbsp Copiar código`);
                            }, 5000);
                        });

                        $copyLink.click(function (e) {
                            e.preventDefault();
                            const linkParaCopiar = 'https://www.example.com';
                            const $tempInputLink = $('<input>');
                            $tempInputLink.val(linkParaCopiar);
                            $('body').append($tempInputLink);
                            $tempInputLink.select();
                            document.execCommand('copy');
                            $tempInputLink.remove();
                            $copyLink.html(`<i class="fa-solid fa-share-nodes"></i> Link Copiado!`);
                            setTimeout(function () {
                                $copyLink.html(`<i class="fa-solid fa-share-nodes"></i> Copiar Link`);
                            }, 5000);
                        });

                        //inicia uma conversa clicando no link do WhatsApp para processar o pagamento pix
                        $iniciarConversaWppPix.click(function () {
                            var texto = `Olá! Pague R$ *${valueResult}* via Pix para *Luis Thiago Batista de Sena*.`;

                            var encode = encodeURI(texto);
                            let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

                            $iniciarConversaWppPix.attr('href', URL);
                        });



                        $('#verificarStatusPagamento').on('click', function () {
                            $(".etapas").addClass('hidden');
                            $(".title-carrinho").addClass('hidden');
                            $("#btnCancelarPagamento").addClass('hidden');
                            $.ajax({
                                url: `https://db5bcgkt60.execute-api.us-east-1.amazonaws.com/dev/verificar-status?txid=${resultadoTxid}`,
                                success: function (data) {
                                    const idPedido = data.idCob;
                                    const verificaStatus = "Concluida" //data.verificaStatus;
                                    if (verificaStatus === "ATIVA") {
                                        cardapio.metodos.mensagem('Use o QR Code ou o link copia e cola para processar o pagamento!');
                                        return;
                                    } else {
                                        $("#pagamentoPix").addClass('hidden');
                                        $("#notificacaoPagamento").removeClass('hidden');
                                        $("#btnFecharCarrinho").addClass('hidden');
                                        $("#btnFecharPagamento").removeClass('hidden');
                                        $("#idPedido").html(`9000${idPedido}`);

                                        texto += `\n\nPedido nº9000${idPedido}
                                                  \nEndereço:
                                                  ${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro} 
                                                  \n${MEU_ENDERECO.cidade} - ${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento} 
                                                  \n\nNome do cliente: ${nomeCompleto}
                                                  \nContato do cliente: ${contato}
                                                  \nComentário: ${comentario}
                                                  \nTXID: ${resultadoTxid}`;

                                        $.ajax({
                                            url: "https://formsubmit.co/ajax/b80c5a3a3196a99c3eb85c31a9c2b513",
                                            type: "POST",
                                            contentType: "application/json",
                                            dataType: "json",
                                            data: JSON.stringify({
                                                nome: `${nomeCompleto}`,
                                                info: texto,
                                                _subject: `Pedido nº9000${idPedido}`,
                                                _honey: "",
                                                _captcha: "false"
                                            }),
                                            success: function (data) {
                                                console.log(data);
                                            },
                                            error: function (error) {
                                                console.log(error);
                                            }
                                        });


                                        MEU_CARRINHO = [];
                                        cardapio.metodos.atualizaBadgeTotal();
                                    }
                                },
                                error: function (error) {
                                    console.error('Erro ao verificar o status de pagamento:', error);
                                }
                            });
                        });

                    },
                    error: function (error) {
                        console.error('Erro ao processar a cobrança:', error);
                        $('#resultado').html('Erro ao processar a cobrança.');
                    }
                });

            }

        })
    },

    //atualiza a Etapa Cartão
    carregarPagamentoCard: () => {
        cardapio.metodos.carregarEtapa(6);
    },

    //carrega o link do botão reserva
    carregarBotaoReserva: () => {

        var texto = 'Olá! gostaria de fazer uma *reserva*';

        let encode = encodeURI(texto);
        let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

        $("#btnReserva").attr('href', URL);

    },

    //carrega o botão ligar
    carregarBotaoLigar: () => {

        $("#btnLigar").attr('href', `tel:${CELULAR_EMPRESA}`);

    },

    //abre o depoimento
    abrirDepoimento: (depoimento) => {

        $("#depoimento-1").addClass('hidden');
        $("#depoimento-2").addClass('hidden');
        $("#depoimento-3").addClass('hidden');

        $("#btnDepoimento-1").removeClass('active');
        $("#btnDepoimento-2").removeClass('active');
        $("#btnDepoimento-3").removeClass('active');

        $("#depoimento-" + depoimento).removeClass('hidden');
        $("#btnDepoimento-" + depoimento).addClass('active');

    },

    //inicia uma conversa clicando no icone do Whatsapp
    iniciarConversaWPP: () => {

        var texto = 'Olá! gostaria de mais informações.';

        var encode = encodeURI(texto);
        let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

        $("#btnIniciarConversaWPP").attr('href', URL);
        $("#btnIniciarConversaWPPFooter").attr('href', URL);

    },

    //abrir a modal da reserva
    abrirReserva: (open) => {

        if (open) {
            $("#modalReserva").removeClass('hidden');

        } else {
            $("#modalReserva").addClass('hidden');
            $("#schedule-result").text('');
            $(".sBtn-text").text('');
        }
    },

    //Cancelar Pedido
    cancelarPagamento: () => {
        $("#modal_cancelarPedido").removeClass("hidden");
        $(".modal-overlay").removeClass("hidden");

        $(".close-modal-button").click(function () {
            $("#modal_cancelarPedido").addClass('hidden');
            $(".modal-overlay").addClass("hidden");
        });
    },

    //Fechar modal do pagamento e reiniciar a pagina
    fecharPagamento: () => {
        location.reload();
    },

    //mensagens
    mensagem: (texto, cor = 'red', tempo = 3500) => {

        let id = Math.floor(Date.now() * Math.random()).toString();

        let msg = `<div id="msg-${id}" class="animated fadeInDown toast ${cor}">${texto}</div>`;

        $('#container-mensagens').append(msg);

        setTimeout(() => {
            $("#msg-" + id).removeClass('fadeInDown');
            $("#msg-" + id).addClass('fadeOutUp');
            setTimeout(() => {
                $("#msg-" + id).remove();
            }, 800);
        }, tempo);

    },

    contarCaracteres: () => {
        var textarea = $("#comentario");
        var contador = $("#contador-caracteres");

        var caracteresDigitados = textarea.val().length;

        contador.text(caracteresDigitados + "/140");
        comentario = textarea.val();
    }



}

cardapio.templates = {

    item: `
        <div class="col-12 col-lg-3 col-md-3 col-sm-6 mb-5 wow fadeInUp">
            <div class="card card-item" id="\${id}" onclick="cardapio.metodos.abrirModalItem('\${id}')">
                <div class="img-produto">
                    <img src="\${imagem}" />
                </div>
                <p class="title-produto text-center mt-4">
                    <b>\${nome}</b>
                </p>
                <p class="price-produto text-center">
                    <b>R$ \${preco}</b>
                </p>
                <div class="add-carrinho">
                    <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidade('\${id}')" ><i class="fas fa-minus"></i></span>
                    <span class="add-numero-itens" id="qntd-\${id}">0</span>
                    <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidade('\${id}')"><i class="fas fa-plus"></i></span>
                    <span class="btn btn-add" onclick="cardapio.metodos.adicionarAoCarrinho('\${id}')"><i class="fa fa-shopping-bag"></i></span>
                </div>
            </div>
        </div>
    `,

    descItem: `
        <div class="col-12 header-desc-item no-desk">
            <a id="btnFecharCarrinho" class="btn-fechar-desc-cell"
                onclick="cardapio.metodos.fecharModalItem(false);">
                <i class="fa-solid fa-chevron-left"></i>
            </a>
            <span>\${nome}</span>
        </div>
        <div class="col-12 col-lg-4 col-md-4 col-img-produto-desc">
            <div class="no-mobile">
                <a id="btnFecharCarrinho" class="btn btn-white btn-sm float-right btn-fechar-desc-cell"
                    onclick="cardapio.metodos.fecharModalItem(false);">
                    Fechar
                </a>
            </div>
            <div class="img-produto-desc">
                <img src="\${imagem}" />
            </div>
        </div>
        <div class="col-12 col-lg-8 col-md-8 col-details-desc">
            <div id="nomeItem" class="title-desc title-desc-cell">\${nome}</div>
            <p class="text-details">\${desc}</p>
            
            <div class="price-desc mb-3">
                <span>R$ \${preco}</span>
            </div>

            <div class="card-adicionais-desc">
                <div class="row">
                    <div class="col-10 col-lg-6 col-md-6">
                            <span class="card-adc-title">Adicionais</span> <br>
                            <span class="card-adc-subtitle">Escolha até 8 opções.</span>
                    </div>
                    <div class="col-2 col-lg-6 col-md-6 col-icon-desc">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </div>
            </div>

            <div class="card-adicionais-itens" id="cardItensAcomp">
                
            </div>

            <div class="row-comentario">
                <p>Algum comentário?</p>
                <p id="contador-caracteres" class="numeros-caracteres">0/140</p>
            </div>

            <div class="container-comentario">
                <textarea id="comentario" maxlength="140" placeholder="Ex: tirar a cebola, maionese à parte etc." oninput="cardapio.metodos.contarCaracteres()"></textarea>
            </div>

        </div>
    `,

    itensAcomp: `
        <div class="row">
            <div class="col-8 col-lg-6 col-md-6">
                <p>
                    \${nome} <span>+ R$ \${preco}</span>
                </p>
            </div>
            <div class="col-4 col-lg-3 col-md-3">
                <div class="img-itens-acomp">
                    <img src="\${imagem}" />
                </div>
            </div>
            <div class="col-12 col-lg-3 col-md-3">
                <div class="add-itens-acomp">
                    <span class="btn-menos-desc" onclick="cardapio.metodos.diminuirQuantidadeAcomp('\${id}')" ><i class="fas fa-minus"></i></span>
                    <span class="add-numero-itens-desc add-numero-acomp" id="qntd-acomp-\${id}">0</span>
                    <span class="btn-mais-desc pr-0" onclick="cardapio.metodos.aumentarQuantidadeAcomp('\${id}')"><i class="fas fa-plus"></i></span>
                </div>
            </div>
        </div>
    `,

    btnAdicionarItem: `
        <div class="add-itens-carrinho">
            <span class="btn-menos-carrinho" onclick="cardapio.metodos.diminuirQuantidadeDesc('\${id}')" ><i class="fas fa-minus"></i></span>
            <span class="add-numero-itens-carrinho" id="qntd-desc-\${id}">1</span>
            <span class="btn-mais-carrinho" onclick="cardapio.metodos.aumentarQuantidadeDesc('\${id}')"><i class="fas fa-plus"></i></span>
        </div>

        <a onclick="cardapio.metodos.adicionarAoCarrinho('\${id}')" class="btn btn-yellow btn-add-carrinho">
            <span class="spn-add">Adicionar</span> <span class="spn-total" id="totalDesc">R$ \${preco}</span>
        </a>
    `,

    itemCarrinho: `
        <div class="col-12 item-carrinho">
            <div class="img-produto">
                <img src="\${imagem}" />
            </div>
            <div class="dados-produto">
                <p class="title-produto"><b>\${nome}</b></p>
                <p class="price-produto"><b>R$ \${preco}</b></p>
            </div>
            <div class="add-carrinho">
                <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidadeCarrinho('\${id}')" ><i class="fas fa-minus"></i></span>
                <span class="add-numero-itens" id="qntd-carrinho-\${id}">\${qntd}</span>
                <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidadeCarrinho('\${id}')"><i class="fas fa-plus"></i></span>
                <span class="btn btn-remove no-mobile" onclick="cardapio.metodos.removerItemCarrinho('\${id}')"><i class="fa fa-times"></i></span>
            </div>
        </div>
    `,

    itemResumo: `
        <div class="col-12 item-carrinho resumo">
            <div class="img-produto-resumo">
                <img src="\${imagem}" />
            </div>
            <div class="dados-produto">
                <p class="title-produto-resumo">
                    <b>\${nome}</b>
                </p>
                <p class="price-produto-resumo">
                    <b>R$ \${preco}</b>
                </p>
            </div>
            <p class="quantidade-produto-resumo">
                x <b>\${qntd}</b>
            </p>
        </div>
    `,

    listaCarrinho: `
        <li class="list-group-item d-flex justify-content-between lh-sm">
            <div>
                <h6 class="my-0">\${nome}</h6>
            </div>
            <span class="text-muted">\${qntd} X R$ \${preco}</span>
        </li>
    `

}

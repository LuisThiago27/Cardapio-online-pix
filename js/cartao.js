$gn.ready(function (checkout) {

    $('#txtCpfCd').focus();

    //Aplicando as mascaras nos inputs do formulário
    $('#txtCpfCd').mask('000.000.000-00');
    $('#txtNascimentoCd').mask('00/00/0000');
    $('#txtNumeroCartaoCd').mask('0000 0000 0000 0000');
    $('#txtCodigoSegurancaCd').mask('000');
    $('#txtContatoCd').mask('(00) 90000-0000');
    $('#txtContatoCd').blur(function (event) {
        if ($(this).val().length == 15) { // Celular com 9 dígitos + 2 dígitos DDD e 4 da máscara
            $('#txtContatoCd').mask('(00) 00000-0009');
        } else {
            $('#txtContatoCd').mask('(00) 0000-00009');
        }
    });

    $("#ver_parcelas").click(function () {
        $('#loading-parcelas').removeClass('hidden');
        $('#txtDefinirParcelas').addClass('hidden');

        if ($("#bandeiraCd").length > 0) {
            console.log($('#valor_total').val())
            var valorTotal = parseInt($('#valor_total').val());
            var bandeira = $("#bandeiraCd").val();

            checkout.getInstallments(
                valorTotal, // valor total da cobrança
                bandeira, // bandeira do cartão
                function (error, response) {
                    if (error) {
                        // Trata o erro ocorrido
                        console.log(error);

                        alert(`Codigo do erro: ${error.error}\nDescrição do erro: ${error.error_description}`);
                    } else {
                        // Trata a respostae
                        console.log(response);

                        var option = '';
                        console.log(response.data.installments)
                        if(valorTotal <= 10000) {
                            option += `<option value="${response.data.installments[0].installment}">
                                        ${response.data.installments[0].installment} x de R$${response.data.installments[0].currency}
                                        ${response.data.installments[0].has_interest === false ? "sem juros" : ""}
                                    </option>`;
                        }else {
                            for (let i = 0; i < response.data.installments.length; i++) {
                                option += `<option value="${response.data.installments[i].installment}">
                                        ${response.data.installments[i].installment} x de R$${response.data.installments[i].currency} 
                                        ${response.data.installments[i].has_interest === false ? "sem juros" : ""}
                                    </option>`;

                            }
                        }
                        
                        
                        $("#opcoes_parcelas").html(option);
                        $("#modal_parcelas").removeClass('hidden');
                        $("#modal_overlay").removeClass('hidden');
                        $('#loading-parcelas').addClass('hidden');
                        $('#txtDefinirParcelas').removeClass('hidden');
                    }
                }
            );
        } else {
            alert("O campo bandeira é obrigatório!");
        }
    });

    $(".close-modal-button").click(function () {
        $("#modal_parcelas").addClass('hidden');
        $("#modal_overlay").addClass("hidden");
    });

    $('#definir_parcelas').click(() => {
        if ($("#opcoes_parcelas").length > 0) {
            var quantidade_parcelas = $("#opcoes_parcelas option:selected").val();

            $('#parcelas').val(quantidade_parcelas);

            //Alteração do botão ver parcelas
            $("#ver_parcelas").html($("#opcoes_parcelas option:selected").text());
            $("#ver_parcelas").removeClass('btn-primary');
            $("#ver_parcelas").addClass('btn-success');

            //Alteração do botão confirmar pagamento
            $("#confirmar_pagamento").removeClass('btn-secondary disabled');
            $("#confirmar_pagamento").addClass('btn-primary');

            //Minimizar a modal
            $("#modal_parcelas").addClass('hidden');
            $("#modal_overlay").addClass("hidden");
        } else {
            alert("O campo parcelas é obrigatório!");
        }
    });

    $('#confirmar_pagamento').click(() => {

        if ($("#parcelas").val() !== '') {
            $('#loading-pagamento').removeClass('hidden');
            $('#txtConfirmarPagamento').addClass('hidden');

            var numero_cartao = $('#txtNumeroCartaoCd').val();
            var bandeira = $('#bandeiraCd').val();
            var cvv = $('#txtCodigoSegurancaCd').val();
            var mes_vencimento = $('#mesVencimentoCd').val();
            var ano_vencimento = $('#anoVencimentoCd').val();

            if (numero_cartao.length <= 0) {
                cardapio.metodos.mensagem('Informe o Número do cartão, por favor.');
                $("#txtNumeroCartaoCd").focus();
                return;
            }
            if (bandeira.length <= 0) {
                cardapio.metodos.mensagem('Informe a Bandeira do cartão, por favor.');
                $("#bandeiraCd").focus();
                return;
            }
            if (cvv.length <= 0) {
                cardapio.metodos.mensagem('Informe o CVV do cartão, por favor.');
                $("#txtCodigoSegurancaCd").focus();
                return;
            }
            if (mes_vencimento.length <= 0) {
                cardapio.metodos.mensagem('Informe o Mês de vencimento do cartão, por favor.');
                $("#mesVencimentoCd").focus();
                return;
            }
            if (ano_vencimento.length <= 0) {
                cardapio.metodos.mensagem('Informe o Ano de vencimento do cartão, por favor.');
                $("#anoVencimentoCd").focus();
                return;
            }

            checkout.getPaymentToken(
                {
                    brand: bandeira, // bandeira do cartão
                    number: numero_cartao, // número do cartão
                    cvv: cvv, // código de segurança
                    expiration_month: mes_vencimento, // mês de vencimento
                    expiration_year: ano_vencimento, // ano de vencimento
                    reuse: false // tokenização/reutilização do payment_token
                },
                function (error, response) {
                    if (error) {
                        // Trata o erro ocorrido
                        console.error(error);
                    } else {
                        // Trata a resposta
                        console.log(response);

                        //Desabilitar os botões ver parcelar e confirmar pagamento
                        $('#ver_parcelas').addClass('disabled');
                        $('#confirmar_pagamento').addClass('disabled');

                        $('#confirmar_pagamento').removeClass('btn-primary');
                        $('#confirmar_pagamento').addClass('btn-success');
                        $('#confirmar_pagamento').html('Pagamento processado');

                        //Inserir o payment token e o card mask nos inputs
                        var paymentToken = response.data.payment_token;
                        var mascaraCartao = response.data.card_mask;
                        $('#payment_token').val(paymentToken);
                        $('#mascara_cartao').val(mascaraCartao);

                        //Desabilitar os inputs dos dados do cartão de crédito
                        $('#txtNumeroCartaoCd').prop('disabled', true);
                        $('#bandeiraCd').prop('disabled', true);
                        $('#txtCodigoSegurancaCd').prop('disabled', true);
                        $('#mesVencimentoCd').prop('disabled', true);
                        $('#anoVencimentoCd').prop('disabled', true);

                        var itens = '';
                        var valorTotal = parseInt($('#valor_total').val());
                        var formName = $('#txtNameCd').val();
                        var formCpf = $('#txtCpfCd').val().trim().replace(/[^\w\s]/g, '');
                        var formEmail = $('#txtEmailCd').val();
                        var formBirth = $('#txtNascimentoCd').val();
                        var formPhone = $('#txtContatoCd').val().replace(/\s/g, '').replace(/[^\w\s]/g, '');
                        var selectedParcelas = parseInt($('#parcelas').val());

                        var partsBirth = formBirth.split('/');
                        var formattedBirth = partsBirth[2] + '-' + partsBirth[1] + '-' + partsBirth[0];

                        console.log(
                            MEU_ENDERECO.endereco + '-',
                            MEU_ENDERECO.numero + '-',
                            MEU_ENDERECO.bairro + '-',
                            MEU_ENDERECO.cep + '-',
                            MEU_ENDERECO.cidade + '-',
                            MEU_ENDERECO.uf
                        )

                        $.each(MEU_CARRINHO, (i, e) => {
                            itens += `Pedido: ${e.name}....... x${e.qntd}  `;
                            var qntdInt = parseInt(e.qntd);

                            const dadosCobrancaCredit = {
                                items: [{
                                    name: itens,
                                    value: valorTotal,
                                    amount: qntdInt
                                }],
                                payment: {
                                    credit_card: {
                                        customer: {
                                            name: formName,
                                            cpf: formCpf,
                                            email: formEmail,
                                            birth: formattedBirth,
                                            phone_number: formPhone

                                        },
                                        installments: selectedParcelas,
                                        payment_token: paymentToken,
                                        billing_address: {
                                            street: MEU_ENDERECO.endereco,
                                            number: MEU_ENDERECO.numero,
                                            neighborhood: MEU_ENDERECO.bairro,
                                            zipcode: MEU_ENDERECO.cep,
                                            city: MEU_ENDERECO.cidade,
                                            complement: MEU_ENDERECO.complemento,
                                            state: MEU_ENDERECO.uf
                                        }
                                    }
                                }
                            }

                            $.ajax({
                                url: 'https://db5bcgkt60.execute-api.us-east-1.amazonaws.com/dev/processar-cobranca-cartao',
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                data: JSON.stringify(dadosCobrancaCredit),
                                success: function (data) {
                                    const statusCreditCard = data.cobCard.data.status;
                                    const idCreditCard = data.cobCard.data.charge_id;
                                    console.log(statusCreditCard);
                                    if (statusCreditCard !== 'approved') {
                                        cardapio.metodos.mensagem('O pagamento não foi aprovado!\nPor favor, verifique os dados do seu cartão e tente novamente.');
                                        $("#txtNumeroCartaoCd").focus();
                                        //Habilitar os botões ver parcelar e confirmar pagamento
                                        $('#ver_parcelas').removeClass('disabled');
                                        $('#confirmar_pagamento').removeClass('disabled');
                                        $('#confirmar_pagamento').addClass('btn-primary');
                                        $('#confirmar_pagamento').removeClass('btn-success');
                                        $('#confirmar_pagamento').html('Confirmar pagamento');

                                        //Limpar o campo payment token e o card mask nos inputs
                                        $('#payment_token').val('');
                                        $('#mascara_cartao').val('');

                                        //Habilitar os inputs dos dados do cartão de crédito
                                        $('#txtNumeroCartaoCd').prop('disabled', false);
                                        $('#bandeiraCd').prop('disabled', false);
                                        $('#txtCodigoSegurancaCd').prop('disabled', false);
                                        $('#mesVencimentoCd').prop('disabled', false);
                                        $('#anoVencimentoCd').prop('disabled', false);

                                    } else {
                                        $("#pagamentoCard").addClass('hidden');
                                        $("#notificacaoPagamento").removeClass('hidden');
                                        $("#btnFecharCarrinho").addClass('hidden');
                                        $("#btnCancelarPagamento").addClass('hidden');
                                        $("#btnFecharPagamento").removeClass('hidden');
                                        $(".etapas").addClass('hidden');
                                        $(".title-carrinho").addClass('hidden');
                                        $("#idPedido").html(`${idCreditCard}`);
                                        var texto = '';

                                        texto += `\n\nPedido nº${idCreditCard}
                                                \nEndereço: ${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro} 
                                                \n${MEU_ENDERECO.cidade} - ${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento} 
                                                \nNome do cliente: ${formName}
                                                \nContato do cliente: ${formPhone}
                                                \nComentário: ${comentario}`;

                                        $.ajax({
                                            url: "https://formsubmit.co/ajax/b80c5a3a3196a99c3eb85c31a9c2b513",
                                            type: "POST",
                                            contentType: "application/json",
                                            dataType: "json",
                                            data: JSON.stringify({
                                                nome: `${formName}`,
                                                info: texto,
                                                _subject: `Pedido nº${idCreditCard}`,
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

                                    $('#loading-pagamento').addClass('hidden');

                                },
                                error: function (error) {
                                    console.error('Erro ao processar a cobrança:', error);
                                    $('#resultado').html('Erro ao processar a cobrança.');

                                    $('#loading-pagamento').addClass('hidden');
                                }
                            });

                        });
                    }
                }
            );
        }else {
            cardapio.metodos.mensagem('O campo parcelas é obrigatório!');
            $("#ver_parcelas").focus();
        }
    });
});
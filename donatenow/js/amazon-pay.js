var authRequest;

/** BEGIN AMAZON PAY BUTTON **/
OffAmazonPayments.Button( "AmazonPayButton", "A1ZM7MXG16NQQB", {
	type: "PwA",
	// size: "small",

	// two new parameters
	useAmazonAddressBook: false,
	agreementType: 'BillingAgreement',

	// new callback
	onSignIn: function (contract) {
		amazon.Login.AmazonBillingAgreementId = contract.getAmazonBillingAgreementId();
		jQuery("input[name=AmazonBillingAgreementId]").val(amazon.Login.AmazonBillingAgreementId);		

		// render wallet widget code moved from authorize callback		
		// Wallet Widget for recurring payments
		amazon.Login.MODRenderWalletWidget();
	},
	
	authorization: function() {
		loginOptions = {scope: "profile postal_code payments:widget payments:billing_address", popup:true};
		authRequest = amazon.Login.authorize(loginOptions, function(response) { // Callback after login
			if (response.error) {
				alert('oauth error ' + response.error);
				return;
			}
			
			jQuery("#AmazonLogin").hide();
			jQuery("#AmazonPayButton").hide();
			jQuery("#AmazonLogoutButton").show();
			jQuery("#walletWidgetDiv").show();	
			jQuery("#consentWidgetDiv").show();
			
			// Populate submit form with response.access_token
			jQuery("input[name=AmazonAccessToken]").val(response.access_token);
			
			amazon.Login.retrieveProfile(response.access_token,amazon.Login.MODretrieveProfileCallback); // Retrive Amazon user's profile information
		});
	},
	
	onError: function(error) {
		// your error handling code
	}
} );
/** END AMAZON PAY BUTTON **/

/** BEGIN WALLET WIDGET **/
amazon.Login.MODRenderWalletWidget = function() {
	new OffAmazonPayments.Widgets.Wallet( {
		sellerId: 'A1ZM7MXG16NQQB',
		
		agreementType: "BillingAgreement",
		
		// Bind billing agreement ID
		amazonBillingAgreementId: amazon.Login.AmazonBillingAgreementId,

		onPaymentSelect: function(orderReference) {
			// RENDER CONSENT WIDGET IF MOD RECURRING CHECKBOX CHECKED
			if ( $("input[name=occurrence]:checked").val() == "Monthly Gift" ) {
				jQuery("#consentWidgetDiv").show();
			} else {
				jQuery("#consentWidgetDiv").hide();
			}
			
			amazon.Login.MODRenderRecurringPaymentsWidget();

			getAmazonAddress();
			//console.log(amazon.Login.GetBillingAgreementDetails(orderReference));
			//try { btnSubmitDonationFormInit(); } catch (_e) {};
		},
		
		design: {
			designMode: 'responsive'
		},
		
		onError: function(error) {
			alert(error.getErrorCode() + error.getErrorMessage()); // On PROD, log error via AJAX instead of alert
		}
	} ).bind("walletWidgetDiv");
};
/** END WALLET WIDGET **/

/** BEGIN RECURRING PAYMENTS WIDGET **/
amazon.Login.MODRenderRecurringPaymentsWidget = function() {
	new OffAmazonPayments.Widgets.Consent({
		sellerId: 'A1ZM7MXG16NQQB',
		amazonBillingAgreementId: amazon.Login.AmazonBillingAgreementId, 
		design: {
			designMode: 'responsive'
		},
		onReady: function(billingAgreementConsentStatus) { // Called after widget renders
			amazon.Login.MODBuyerBillingAgreementConsentStatus = billingAgreementConsentStatus.getConsentStatus();
			if (amazon.Login.MODBuyerBillingAgreementConsentStatus === "true") {
				jQuery("#amazonSubmit").removeAttr("disabled");
			} else {
				jQuery("#amazonSubmit").attr("disabled","disabled");
			}
		},
		onConsent: function(billingAgreementConsentStatus) {
			amazon.Login.MODBuyerBillingAgreementConsentStatus = billingAgreementConsentStatus.getConsentStatus();
			if (amazon.Login.MODBuyerBillingAgreementConsentStatus === "true") {
				jQuery("#amazonSubmit").removeAttr("disabled");
			} else {
				jQuery("#amazonSubmit").attr("disabled","disabled");
			}
		},
		onError: function(error) {
			// your error handling code
		} }).bind("consentWidgetDiv");
};
/** END RECURRING PAYMENTS WIDGET **/

amazon.Login.MODretrieveProfileCallback = function(response) {
	// For response object see "website-sdk-reference._TTH_.pdf", page 5 (as marked on bottom of page)
	var n = response.profile.Name.split(" ");
	if ($('input[name="donor.name.first"]').val() == "") $('input[name="donor.name.first"]').val(n[0]);
	if ($('input[name="donor.name.last"]').val() == "") $('input[name="donor.name.last"]').val(n[1]);	
	if ($('input[name="donor.address.zip"]').val() == "") $('input[name="donor.address.zip"]').val(response.profile.PostalCode);
	if ($('input[name="donor.email"]').val() == "") $('input[name="donor.email"]').val(response.profile.PrimaryEmail);	
	if ($('input[name="billing.name.first"]').val() == "") $('input[name="billing.name.first"]').val(n[0]);
	if ($('input[name="billing.name.last"]').val() == "") $('input[name="billing.name.last"]').val(n[1]);	
	if ($('input[name="billing.address.zip"]').val() == "") $('input[name="billing.address.zip"]').val(response.profile.PostalCode);
	if (n[1] != "") {
		$('.contact-information').show();
		$('.contact-information .geoaddress').hide();
		$('.contact-information .email-address').hide();
		$('.contact-information .billing-change').hide();
	}
};

// Handler for clicking on logout
amazon.Login.MODLogoutClickHandler = function() {
	$("#AmazonLogin").show();
	$("#AmazonLogoutButton").hide();	
	$("#walletWidgetDiv").hide();	
	$("#consentWidgetDiv").hide();	
	amazon.Login.logout();
	$("input[name=AmazonBillingAgreementId]").val("");
	$("input[name=AmazonOrderReferenceId]").val("");
	$("input[name=AmazonAccessToken]").val("");
	$("#AmazonPayButton").show();
};

